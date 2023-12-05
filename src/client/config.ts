import {
  Layout,
  ModuleClientRouter,
  Office,
  AppRole,
  AppModule,
} from '#shared/types'

type ClientModuleConfig = {
  id: string
  name: string
  router: ModuleClientRouter
  portals: AppModule['portals']
}

export type ClientOfficeConfig = Pick<
  Office,
  | 'id'
  | 'name'
  | 'icon'
  | 'timezone'
  | 'country'
  | 'city'
  | 'allowGuestInvitation'
  | 'allowDeskReservation'
  | 'allowRoomReservation'
>

type ClientUserRole = Pick<AppRole, 'id' | 'name' | 'accessByDefault'> & {
  lowPriority: boolean
}

type ClientAppConfig = {
  modules: ClientModuleConfig[]
  offices: ClientOfficeConfig[]
  departments: string[]
  divisions: string[]
  appName: string
  companyName: string
  appHost: string
  mapBoxApiKey: string
  layout: Layout
  roles: ClientUserRole[]
  auth: ClientAuthConfig
  authMessageToSign: string
}

type ClientAuthConfig = { providers: string[] }

const config: ClientAppConfig = {
  modules: process.env.APP_MODULES as unknown as ClientModuleConfig[],
  offices: process.env.APP_OFFICES as unknown as ClientOfficeConfig[],
  departments: process.env.DEPARTMENTS as unknown as string[],
  divisions: process.env.DIVISIONS as unknown as string[],
  appName: process.env.APP_NAME as unknown as string,
  companyName: process.env.COMPANY_NAME as unknown as string,
  appHost: process.env.APP_HOST as unknown as string,
  mapBoxApiKey: process.env.MAPBOX_API_KEY as unknown as string,
  layout: process.env.LAYOUT as unknown as Layout,
  roles: process.env.ROLES as unknown as ClientUserRole[],
  auth: process.env.AUTH as unknown as ClientAuthConfig,
  authMessageToSign: process.env.AUTH_MESSAGE_TO_SIGN as unknown as string,
}

export default config
