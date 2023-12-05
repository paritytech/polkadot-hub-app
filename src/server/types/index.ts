import { OAuth2Namespace } from '@fastify/oauth2'
import { Sequelize } from 'sequelize/types'
import { FastifyBaseLogger } from 'fastify'
import { AppConfig } from '#server/app-config'
import { Office } from '#server/app-config/types'
import {
  ConnectedModels as _ConnectedModels,
  ConnectedIntegrations as _ConnectedIntegrations,
  User,
} from './__import-models-integrations'
import { PermissionsSet } from '#shared/utils'

export type ConnectedModels = _ConnectedModels

export type ConnectedIntegrations = _ConnectedIntegrations

declare module 'fastify' {
  interface FastifyInstance {
    googleOAuth2?: OAuth2Namespace
    db: ConnectedModels
    sequelize: Sequelize
    integrations: ConnectedIntegrations
  }
  interface FastifyRequest {
    user: User
    permissions: PermissionsSet
    can: (permission: string) => boolean
    check: (...permissions: string[]) => void | never
    office?: Office
  }
  interface FastifyReply {
    ok: (msg?: string) => void
    setSessionCookie: (userId: string, path?: string) => FastifyReply
    throw: {
      notFound: (msg?: string) => void
      badParams: (msg?: string) => void
      rejected: (msg?: string) => void
      misconfigured: (msg?: string) => void
      authException: (msg?: string) => void
      accessDenied: (msg?: string) => void
      conflict: (msg?: string) => void
      gone: (msg?: string) => void
      internalError: (msg?: string) => void
    }
  }
}

export type CronJobContext = {
  models: ConnectedModels
  sequelize: Sequelize
  integrations: ConnectedIntegrations
  log: FastifyBaseLogger
  appConfig: AppConfig
}

export type CronJob = {
  name: string
  cron: string
  fn: (ctx: CronJobContext) => Promise<void>
}

export type ModuleCronJobsFactory = (ctx: CronJobContext) => CronJob[]

export type GoogleParsedStateQueryParam = Record<
  'callbackPath' | 'account' | 'signature',
  string | null
>

export type SafeResponse<T = undefined> =
  | { success: true; data: T extends undefined ? never : T }
  | { success: false; error: Error }
  | { success: true }
