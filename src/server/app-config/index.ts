import fs from 'fs'
import { ZodError, ZodSchema } from 'zod'
import { fromZodError } from 'zod-validation-error'
import config from '#server/config'
import { safeRequire, getFilePath } from '#server/utils'
import { PermissionsSet } from '#shared/utils'
import * as fp from '#shared/utils/fp'
import { log } from '#server/utils/log'
import { AppTemplates } from './templates'
import {
  AppModule,
  AppIntegration,
  IntegrationManifest,
  Office,
  AppConfigJson,
} from './types'
import * as schemas from './schemas'

class AppError extends Error {
  payload: string | null
  constructor(message: string, payload?: string) {
    super(message)
    this.name = 'AppError'
    this.payload = payload || null
  }
}

export class AppConfig {
  private superusers: Set<string> = new Set(config.superusers)
  private permissionsByRole!: Record<string, string[]>
  private allPermissions!: string[]

  public config!: AppConfigJson
  public modules: AppModule[] = []
  public integrations: AppIntegration[] = []
  public templates!: AppTemplates
  public error: AppError | null = null

  constructor() {
    this.load()
  }

  private unsafeLoad() {
    // validate & store config JSONs
    this.config = {
      application: loadJsonAndValidate(
        './config/application.json',
        schemas.applicationConfig
      ),
      company: loadJsonAndValidate(
        './config/company.json',
        schemas.companyConfig
      ),
      permissions: loadJsonAndValidate(
        './config/permissions.json',
        schemas.permissionsConfig
      ),
      modules: loadJsonAndValidate(
        './config/modules.json',
        schemas.modulesConfig
      ),
    }

    // validate & store modules
    const enabledModules = this.config.modules.modules.filter(
      fp.prop('enabled')
    )
    const appModules: AppModule[] = enabledModules.map((module) => {
      const modulePath = getModuleRelativePath(module.id)
      if (!modulePath) {
        throw new AppError(
          `Can't find "${module.id}" module. Make sure it is represented in one of the following directories:`,
          ['src/modules', 'config/modules'].join('\n')
        )
      }
      const manifest = loadJsonAndValidate(
        `${modulePath}/manifest.json`,
        schemas.moduleManifest
      )
      return {
        ...module,
        manifest,
        buildProps: {
          custom: modulePath.startsWith('config'),
          withComponents: isFileExists(
            `${modulePath}/client/components/index.ts`
          ),
          withPermissions: isFileExists(`${modulePath}/permissions.ts`),
          withTypes: isFileExists(`${modulePath}/types.ts`),
          withMetadata: isFileExists(`${modulePath}/metadata-schema.ts`),
        },
      }
    })
    const dependencyTree: Record<string, string[]> = appModules.reduce(
      (acc, x) => {
        return { ...acc, [x.id]: x.manifest.dependencies || [] }
      },
      {}
    )
    const sortedModuleIds = sortTree(dependencyTree)

    for (const module of appModules) {
      const distPath = module.buildProps.custom
        ? 'config/modules'
        : 'src/modules'
      const metadataSchemaFile = safeRequire(
        getFilePath(`dist_server/${distPath}/${module.id}/metadata-schema`)
      )
      if (metadataSchemaFile?.schema) {
        const parsed = metadataSchemaFile.schema.safeParse(module.metadata)
        if (!parsed.success) {
          throw new AppError(
            `Invalid "metadata" property of the "${module.id}" module. Fix the "./config/modules.json" file.`,
            formatZodError(parsed.error)
          )
        }
        module.metadata = parsed.data
      }
    }
    // TODO: validate declared portal IDs

    this.modules = sortedModuleIds.map(
      (id) => appModules.find(fp.propEq('id', id))!
    )

    // validate & store integrations
    for (const module of appModules) {
      const missedIntegrations = module.manifest.requiredIntegrations.filter(
        (x) => {
          return !module.enabledIntegrations.includes(x)
        }
      )
      if (missedIntegrations.length) {
        throw new AppError(
          `The following integrations are required for the "${
            module.id
          }" module. Enable them in the "./config/modules.json" file: 
          ${missedIntegrations.join('\n')}`
        )
      }
      const allowedIntegrations = [
        ...module.manifest.recommendedIntegrations,
        ...module.manifest.requiredIntegrations,
      ]
      const unsupportedIntegrations = module.enabledIntegrations.filter((x) => {
        return !allowedIntegrations.includes(x)
      })
      if (unsupportedIntegrations.length) {
        throw new AppError(
          `The following integrations are not supported by the "${module.id}" module. Disable them in the "./config/modules.json" file.`,
          unsupportedIntegrations.join('\n')
        )
      }
    }
    const integrationIds = Array.from(
      new Set(
        appModules
          .map(fp.prop('enabledIntegrations'))
          .flat()
          .filter((intId): intId is string => Boolean(intId))
      )
    )
    const integrations = []
    for (const id of integrationIds) {
      const manifest: IntegrationManifest = loadJsonAndValidate(
        `src/integrations/${id}/manifest.json`,
        schemas.integrationManifest
      )
      const missingCredentials = manifest.credentials.reduce<string[]>(
        (acc, x) => (x in process.env ? acc : acc.concat(x)),
        []
      )
      if (missingCredentials.length) {
        throw new AppError(
          `Missing credentials for "${id}" integration`,
          missingCredentials.join(', ')
        )
      }
      integrations.push(manifest)
    }
    this.integrations = integrations

    // store permissions
    this.permissionsByRole = this.config.permissions.roles.reduce((acc, x) => {
      return { ...acc, [x.id]: x.permissions }
    }, {})
    this.allPermissions = appModules
      .map((m) => {
        const distPath = m.buildProps.custom ? 'config/modules' : 'src/modules'
        const { Permissions: permObj = {} } =
          safeRequire(
            getFilePath(`dist_server/${distPath}/${m.id}/permissions`)
          ) || {}
        return Object.values(permObj) as string[]
      })
      .flat()

    // load templates
    this.templates = new AppTemplates(this.modules)
  }

  load() {
    try {
      this.unsafeLoad()
    } catch (err) {
      if (err instanceof AppError) {
        log.error(err)
        this.error = err
      } else {
        throw err
      }
    }
  }

  get offices() {
    return this.config.company.offices
  }

  get lowPriorityRole() {
    return this.config.permissions.defaultRoleByEmailDomain['__default']
  }

  getOfficeById(officeId: string): Office {
    const office = this.config.company.offices.find(fp.propEq('id', officeId))
    if (!office) {
      throw new Error(`Can't find the office "${officeId}"`)
    }
    return office
  }

  getUserPermissions(
    email: string | null,
    authAddresses: string[],
    role: string
  ): PermissionsSet {
    if (email && this.superusers.has(email)) {
      return new PermissionsSet(this.allPermissions)
    }
    if (authAddresses.length) {
      for (let i = 0; i < authAddresses.length; i++) {
        if (this.superusers.has(authAddresses[i])) {
          return new PermissionsSet(this.allPermissions)
        }
      }
    }
    return new PermissionsSet(this.permissionsByRole[role] || [])
  }

  getModuleMetadata(moduleId: string): unknown | null {
    return this.modules.find(fp.propEq('id', moduleId))?.metadata || null
  }

  getDefaultUserRoleByEmail(email: string): string {
    if (!email) {
      return this.lowPriorityRole
    }
    const domain = email.toLowerCase().split('@')[1]
    return (
      this.config.permissions.defaultRoleByEmailDomain[domain] ||
      this.lowPriorityRole
    )
  }

  getRolesByPermission(permission: string): string[] {
    return this.config.permissions.roles
      .filter((x) => x.permissions.includes(permission))
      .map((x) => x.id)
  }
}

export const appConfig = new AppConfig()

// helpers
function formatZodError(error: ZodError): string {
  return fromZodError(error, {
    issueSeparator: '\n',
    prefix: null,
  }).message
}

function loadJsonAndValidate(relativePath: string, schema: ZodSchema) {
  let file: string
  try {
    file = fs.readFileSync(getFilePath(relativePath), 'utf-8')
  } catch (err) {
    throw new AppError(`Can't find a JSON file "${relativePath}"`)
  }
  let data: unknown
  try {
    data = JSON.parse(file)
  } catch (err) {
    throw new AppError(`Can't parse a JSON file "${relativePath}"`)
  }
  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    throw new AppError(
      `Invalid JSON file "${relativePath}" schema`,
      formatZodError(parsed.error)
    )
  }
  return parsed.data
}

function sortTree(tree: Record<string, string[]>): string[] {
  const keys = Object.keys(tree)
  const used = new Set()
  const result: string[] = []
  let i, length, item

  do {
    length = keys.length
    i = 0
    while (i < keys.length) {
      if (tree[keys[i]].every(Set.prototype.has, used)) {
        item = keys.splice(i, 1)[0]
        result.push(item)
        used.add(item)
        continue
      }
      i++
    }
  } while (keys.length && keys.length !== length)

  if (keys.length) {
    throw new AppError(
      `The following modules dependency tree cannot be sorted (circular or unresolved dependency): ${keys.join(
        ', '
      )}`
    )
    // result.push(...keys)
  }
  return result
}

function isFileExists(relativePath: string): boolean {
  return fs.existsSync(getFilePath(relativePath))
}

function getModuleRelativePath(moduleId: string): string | null {
  if (fs.existsSync(getFilePath(`src/modules/${moduleId}/manifest.json`))) {
    return `src/modules/${moduleId}`
  }
  if (fs.existsSync(getFilePath(`config/modules/${moduleId}/manifest.json`))) {
    return `config/modules/${moduleId}`
  }
  return null
}
