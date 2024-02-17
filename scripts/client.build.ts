import { build, BuildOptions, BuildResult, Loader, LogLevel } from 'esbuild'
import fs from 'fs'
import notifier from 'node-notifier'
import watch from 'node-watch'
import path from 'path'
import { appConfig } from '../src/server/app-config'
import { AppModule } from '../src/server/app-config/types'
import config from '../src/server/config'
import * as fp from '../src/shared/utils/fp'

// node client.build.js -w -dev
const args = process.argv.slice(2)
const buildConfig = {
  watch: args.includes('-w'),
  env: args.includes('-dev') ? 'development' : 'production',
  metafile: args.includes('-metafile'),
}

function getBuildConfig(): BuildOptions {
  return {
    color: true,
    entryPoints: ['./src/client/index.tsx'],
    metafile: buildConfig.metafile,
    outdir: './dist_client/js',
    minify: buildConfig.env === 'production',
    bundle: true,
    sourcemap: buildConfig.env === 'development',
    logLevel: 'error' as LogLevel,
    target: 'es2016',
    loader: { '.js': 'jsx' } as { '.js': Loader },
    incremental: !!buildConfig.watch,
    preserveSymlinks: true,
    define: {
      'process.env.NODE_ENV': JSON.stringify(buildConfig.env),
      'process.env.APP_MODULES': JSON.stringify(
        appConfig.modules.map((m) => ({
          id: m.id,
          router: m.manifest.clientRouter || {},
          name: m.manifest.name,
          portals: m.portals,
        }))
      ),
      // TODO: add .env.COMPONENT_ID_BY_ROUTE
      'process.env.AUTH': JSON.stringify(appConfig.config.application.auth),
      'process.env.APP_OFFICES': JSON.stringify(
        appConfig.config.company.offices.map(
          fp.pick([
            'id',
            'name',
            'icon',
            'timezone',
            'country',
            'city',
            'allowGuestInvitation',
            'allowDeskReservation',
            'allowRoomReservation',
          ])
        )
      ),
      'process.env.LAYOUT': JSON.stringify(appConfig.config.application.layout),
      'process.env.APP_NAME': JSON.stringify(appConfig.config.application.name),
      'process.env.APP_LOGO_PREFIX': JSON.stringify(
        appConfig.config.application.logoPrefix
      ),
      'process.env.COMPANY_NAME': JSON.stringify(appConfig.config.company.name),
      'process.env.APP_HOST': JSON.stringify(config.appHost),
      'process.env.MAPBOX_API_KEY': JSON.stringify(process.env.MAPBOX_API_KEY),
      'process.env.AUTH_MESSAGE_TO_SIGN': JSON.stringify(
        config.authMessageToSign
      ),
      'process.env.ROLE_GROUPS': JSON.stringify(
        appConfig.config.permissions.roleGroups.map((x) => ({
          ...x,
          roles: x.roles.map((r) => ({
            ...fp.pick(['id', 'name', 'accessByDefault'])(r),
            lowPriority: r.id === appConfig.lowPriorityRole,
          })),
        }))
      ),
    },
  }
}

;(async function run() {
  const currentWorkingDir = process.cwd()
  const clientPathRe = /src\/client\//
  const modulesPathRe =
    /src\/modules\/[A-Za-z0-9_-]*\/(client|shared\-helpers)\//
  const sharedPathRe = /src\/shared\//
  const dynamicFilePathRe = /\/__import-/
  const includePaths = [clientPathRe, modulesPathRe, sharedPathRe]
  const excludePaths = [dynamicFilePathRe]
  const moduleManifestJsonRe = /src\/modules\/[A-Za-z0-9_-]*\/manifest.json$/

  function handleFileChange(builder: BuildResult, fullReload = false) {
    return async (_, filePath: string) => {
      try {
        console.log(
          'changed:',
          filePath.replace(currentWorkingDir, '').substring(1)
        )
        if (fullReload) {
          appConfig.load()
          generateDynamicFiles()
          builder = await build(getBuildConfig())
        } else if (builder.rebuild) {
          await builder.rebuild()
        }
      } catch (err) {
        notifier.notify({
          title: `❌`,
          message: `Build error`,
          sound: true,
        })
      }
    }
  }

  try {
    if (buildConfig.watch) {
      generateDynamicFiles()
      let builder = await build(getBuildConfig())
      console.log('👀 Watching client files for changes')
      watch(
        path.join(currentWorkingDir, 'src'),
        {
          recursive: true,
          filter: (x) =>
            excludePaths.every((re) => !re.test(x)) &&
            includePaths.some((re) => re.test(x)),
        },
        handleFileChange(builder)
      )
      watch(
        path.join(currentWorkingDir, 'src'),
        {
          recursive: true,
          filter: (x) => moduleManifestJsonRe.test(x),
          // and modules/*/client/components/index.ts
        },
        handleFileChange(builder, true)
      )
      watch(
        path.join(currentWorkingDir, 'config'),
        {
          recursive: true,
        },
        handleFileChange(builder, true)
      )
    } else {
      generateDynamicFiles()
      console.log('📦 Build bundle')
      const builder = await build(getBuildConfig())
      if (buildConfig.metafile) {
        fs.writeFileSync(
          path.join(__dirname, '../drafts/client.metafile.json'),
          JSON.stringify(builder.metafile)
        )
      }
    }
  } catch (err) {
    console.log(`\x1b[31mBuild error:\x1b[39m `, err)
    notifier.notify({
      title: `❌`,
      message: `Build error`,
      sound: true,
    })
  }
})()

function generateModulesComponentsImport() {
  // Generate `src/client/components/__import-components.tsx` file
  console.log('⚙️  Import required components')
  const resultImports: string[] = []
  const resultTypesExports: string[] = []
  const resultExports: string[] = []
  appConfig.modules
    .filter((x) => x.buildProps.withComponents)
    .forEach((m) => {
      const moduleId = camelcasify(m.id)
      const alias = m.buildProps.custom ? '#custom-modules' : '#modules'
      resultImports.push(
        `import * as ${moduleId}Components from '${alias}/${m.id}/client/components'`
      )
      resultTypesExports.push(
        `  '${m.id}': Record<keyof typeof ${moduleId}Components, FC<any>>`
      )
      resultExports.push(`  '${m.id}': { ...${moduleId}Components },`)
    })
  const data = [
    '// this file is dynamically generated via `scripts/client.build.ts`',
    `import { FC } from 'react'`,
    ,
    resultImports.join('\n'),
    ,
    'export type ModuleComponentsType = {',
    resultTypesExports.join('\n'),
    '}',
    ,
    'const moduleComponents: ModuleComponentsType = {',
    resultExports.join('\n'),
    '}',
    ,
    'export default moduleComponents',
  ].join('\n')
  writeFileSync(
    path.join(__dirname, '../src/client/components/__import-components.tsx'),
    data
  )
}

function generateModulesRoutesImport() {
  // Generate `src/client/stores/__import-stores.tsx` file
  console.log('🔀 Import required routes')
  const routeTypeDefinitions: string[] = []
  const routePathDefinitions: string[] = []
  appConfig.modules.forEach((m) => {
    if (m.manifest.clientRouter) {
      for (const routerType in m.manifest.clientRouter) {
        const router =
          m.manifest.clientRouter[routerType as 'admin' | 'user' | 'public']
        if (!router) continue
        for (const routeId in router) {
          const route = router[routeId]
          routePathDefinitions.push(`  '${routeId}': '${route.path}',`)
          routeTypeDefinitions.push(`  | '${routeId}'`)
        }
      }
    }
  })
  const defaultRoutes = [
    { id: 'home', path: '/' },
    { id: 'login', path: '/login' },
    { id: 'polkadot', path: '/polkadot' },
    { id: 'admin', path: '/admin' },
  ]
  const data = [
    '// this file is dynamically generated via `scripts/client.build.ts`',
    ,
    `import { createRouter } from '@nanostores/router'`,
    ,
    `export type Route =`,
    defaultRoutes.map((x) => `  | '${x.id}'`).join('\n'),
    routeTypeDefinitions.join('\n'),
    ,
    `export const router = createRouter({`,
    defaultRoutes.map((x) => `  ${x.id}: '${x.path}',`).join('\n'),
    routePathDefinitions.join('\n'),
    `})`,
  ].join('\n')

  writeFileSync(
    path.join(__dirname, '../src/client/stores/__import-stores.tsx'),
    data
  )
}

function generateModulesPermissionsImport() {
  // Generate `src/shared/permissions/__import-permissions.ts` file
  console.log('🛂 Import permissions')
  const modules = appConfig.modules.filter((x) => x.buildProps.withPermissions)
  const data = [
    '// this file is dynamically generated via `scripts/client.build.ts`',
    ,
    modules
      .map((m) => {
        const alias = m.buildProps.custom ? '#custom-modules' : '#modules'
        return `import { Permissions as ${camelcasify(
          m.id
        )}Permissions } from '${alias}/${m.id}/permissions'`
      })
      .join('\n'),
    ,
    `export const Permissions = {`,
    modules
      .map((m) => `  '${m.id}': ${camelcasify(m.id)}Permissions,`)
      .join('\n'),
    `}`,
  ].join('\n')
  writeFileSync(
    path.join(__dirname, '../src/shared/permissions/__import-permissions.ts'),
    data
  )
}

function generateCommonModulesTypesImport() {
  // Generate `src/shared/types/__import-types.ts` file
  console.log('🆎 Import required common types')
  const exports: string[] = []
  appConfig.modules
    .filter((x) => x.buildProps.withTypes)
    .forEach((m) => {
      const alias = m.buildProps.custom ? '#custom-modules' : '#modules'
      exports.push(`export * from '${alias}/${m.id}/types'`)
    })
  const data = [
    '// this file is dynamically generated via `scripts/client.build.ts`',
    ,
    exports.join('\n'),
  ].join('\n')
  writeFileSync(
    path.join(__dirname, '../src/shared/types/__import-types.ts'),
    data
  )
}

function generateServerModulesTypesImport() {
  // Generate `src/server/types/__import-models-integrations.ts` file
  console.log('🆎 Import required server types')

  const modelsByModuleId: Record<string, string[]> = {}
  appConfig.modules.forEach((module) => {
    ;(module.manifest.models || []).forEach((modelName) => {
      modelsByModuleId[module.id] = [
        ...(modelsByModuleId[module.id] || []),
        modelName,
      ]
    })
  })
  const moduleById = appConfig.modules.reduce<Record<string, AppModule>>(
    fp.by('id'),
    {}
  )
  const integrations = appConfig.integrations.map(fp.pick(['id', 'name']))

  const data = [
    '// this file is dynamically generated via `scripts/client.build.ts`',
    ,
    Object.keys(modelsByModuleId)
      .map((moduleId) => {
        const module = moduleById[moduleId]
        const alias = module.buildProps.custom ? '#custom-modules' : '#modules'
        const models = modelsByModuleId[moduleId].map((x) =>
          x === 'User' ? 'User as _User' : x
        )
        return `import { ${models.join(
          ', '
        )} } from '${alias}/${moduleId}/server/models'`
      })
      .join('\n'),
    integrations
      .map(
        (integration) =>
          `import ${integration.name} from './../../integrations/${integration.id}'`
      )
      .join('\n'),

    ,
    `export type ConnectedModels = {`,
    Object.keys(modelsByModuleId)
      .map((moduleId) => {
        return modelsByModuleId[moduleId]
          .map((modelName) => {
            const refModelName = modelName === 'User' ? '_User' : modelName
            return `  ${modelName}: typeof ${refModelName}`
          })
          .join('\n')
      })
      .join('\n'),
    ,
    `}`,

    ,
    `export type ConnectedIntegrations = {`,
    integrations
      .map((integration) => `  ${integration.name}: ${integration.name}`)
      .join('\n'),
    `}`,
    ,
    `export type User = _User`,
    ,
  ].join('\n')
  writeFileSync(
    path.join(__dirname, '../src/server/types/__import-models-integrations.ts'),
    data
  )
}

function generateDynamicFiles() {
  generateModulesComponentsImport()
  generateModulesRoutesImport()
  generateModulesPermissionsImport()
  generateCommonModulesTypesImport()
  generateServerModulesTypesImport()
}

function writeFileSync(path, data) {
  if (!data) {
    throw new Error('no data')
  }
  if (!fs.existsSync(path)) {
    fs.closeSync(fs.openSync(path, 'w'))
  }
  fs.writeFileSync(path, data)
}

function camelcasify(value) {
  return value.split('-').reduce((acc, x, i) => {
    let chunk = x
    if (i) {
      chunk = chunk[0].toUpperCase() + chunk.slice(1)
    }
    return acc.concat(chunk)
  }, '')
}
