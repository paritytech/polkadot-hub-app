import {
  Layout,
  ModuleClientRouter,
  Office,
  UserRole,
  UserRoleGroup,
  AppModule,
} from '#shared/types'

type ClientModuleConfig = {
  id: string
  name: string
  router: ModuleClientRouter
  portals: AppModule['portals']
  adminLinkCounter: boolean
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

export type ClientUserRole = Pick<
  UserRole,
  'id' | 'name' | 'accessByDefault'
> & {
  lowPriority: boolean
}

export type ClientUserRoleGroup = UserRoleGroup & {
  roles: ClientUserRole[]
}

type ClientAppConfig = {
  modules: ClientModuleConfig[]
  offices: ClientOfficeConfig[]
  appName: string
  appIcon: string
  companyName: string
  appHost: string
  mapBoxApiKey: string
  layout: Layout
  roleGroups: ClientUserRoleGroup[]
  auth: ClientAuthConfig
  authMessageToSign: string
  allowedWallets: string[]
  walletConnectProjectId: string
}

type ClientAuthConfig = { providers: string[] }

const config: ClientAppConfig = {
  modules: process.env.APP_MODULES as unknown as ClientModuleConfig[],
  offices: process.env.APP_OFFICES as unknown as ClientOfficeConfig[],
  appName: process.env.APP_NAME as unknown as string,
  companyName: process.env.COMPANY_NAME as unknown as string,
  appHost: process.env.APP_HOST as unknown as string,
  appIcon: process.env.APP_ICON as unknown as string,
  mapBoxApiKey: process.env.MAPBOX_API_KEY as unknown as string,
  layout: process.env.LAYOUT as unknown as Layout,
  roleGroups: process.env.ROLE_GROUPS as unknown as ClientUserRoleGroup[],
  auth: process.env.AUTH as unknown as ClientAuthConfig,
  authMessageToSign: process.env.AUTH_MESSAGE_TO_SIGN as unknown as string,
  allowedWallets: process.env.ALLOWED_WALLETS as unknown as string[],
  walletConnectProjectId: process.env
    .WALLET_CONNECT_PROJECT_ID as unknown as string,
}

export default config
