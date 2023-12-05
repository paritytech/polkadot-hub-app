import fs from 'fs'
import yaml from 'yaml'
import mustache from 'mustache'
import { getFilePath } from '#server/utils'
import { log } from '#server/utils/log'
import * as fp from '#shared/utils/fp'
import { AppModule } from './types'

enum TemplateKind {
  Email = 'email',
  Notification = 'notification',
  Text = 'text',
  Error = 'error',
}

type EmailTemplate = {
  html: string
  subject: string
}

type TemplateStore = Record<
  string,
  Record<TemplateKind, Record<string, string>>
>

type TemplatePayload = Record<string, any>

export class AppTemplates {
  private store: TemplateStore = {}

  constructor(modules: AppModule[]) {
    for (const module of modules) {
      for (const kind of Object.values(TemplateKind)) {
        if (!this.store[module.id]) {
          this.store[module.id] = {
            [TemplateKind.Email]: {},
            [TemplateKind.Error]: {},
            [TemplateKind.Notification]: {},
            [TemplateKind.Text]: {},
          }
        }
        const defaultDataRootPath = module.buildProps.custom ? 'config' : 'src'
        const defaultData = this.readYaml(
          `${defaultDataRootPath}/modules/${module.id}/templates/${kind}.yaml`
        )
        const customData = this.readYaml(
          `config/templates/${module.id}/${kind}.yaml`
        )
        this.store[module.id][kind] = { ...defaultData, ...customData }
      }
    }
  }

  private readYaml(relativePath: string): object {
    try {
      return yaml.parse(fs.readFileSync(getFilePath(relativePath), 'utf8'))
    } catch (err: any) {
      if (err.code != 'ENOENT') {
        log.error(JSON.stringify(err))
      }
      return {}
    }
  }

  private resolve(
    moduleId: string,
    templateKind: TemplateKind,
    templateId: string,
    payload: TemplatePayload = {}
  ): string | null {
    const templateByOffice = payload?.office?.id
      ? this.store[moduleId]?.[templateKind]?.[
          `${templateId}${fp.capitalize(fp.camelcasify(payload?.office?.id))}`
        ]
      : null

    const templateDefault = this.store[moduleId]?.[templateKind]?.[templateId]

    const template = templateByOffice ?? templateDefault

    if (!template) {
      log.error(
        `Can't find "${templateId}" ${templateKind} template for module "${moduleId}"`
      )
      return null
    }

    return mustache.render(template, payload)
  }

  public error(
    moduleId: string,
    templateId: string,
    payload: TemplatePayload = {}
  ): string | null {
    return this.resolve(moduleId, TemplateKind.Error, templateId, payload)
  }

  public notification(
    moduleId: string,
    templateId: string,
    payload: TemplatePayload = {}
  ): string | null {
    return this.resolve(
      moduleId,
      TemplateKind.Notification,
      templateId,
      payload
    )
  }

  public text(
    moduleId: string,
    templateId: string,
    payload: TemplatePayload = {}
  ): string | null {
    return this.resolve(moduleId, TemplateKind.Text, templateId, payload)
  }

  public email(
    moduleId: string,
    templateId: string,
    payload: TemplatePayload = {}
  ): EmailTemplate | null {
    const html = this.resolve(
      moduleId,
      TemplateKind.Email,
      templateId + 'Html',
      payload
    )
    if (!html) {
      log.warn(
        `Missing html template for "${templateId}" ${TemplateKind.Email} for module "${moduleId}"`
      )
      return null
    }
    const subject = this.resolve(
      moduleId,
      TemplateKind.Email,
      templateId + 'Subject',
      payload
    )
    return { html, subject: subject ?? '' }
  }
}
