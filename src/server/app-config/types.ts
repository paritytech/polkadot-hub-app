import { z } from 'zod'
import * as schemas from './schemas'

export type ComponentRef = z.infer<typeof schemas.componentRef>
export type ApplicationConfig = z.infer<typeof schemas.applicationConfig>
export type Layout = z.infer<typeof schemas.layout>
export type OfficeVisitsConfig = z.infer<typeof schemas.officeVisitsConfig>
export type OfficeAreaDesk = z.infer<typeof schemas.officeAreaDesk>
export type OfficeArea = z.infer<typeof schemas.officeArea>
export type OfficeRoom = z.infer<typeof schemas.officeRoom>
export type Office = z.infer<typeof schemas.office>
export type CompanyConfig = z.infer<typeof schemas.companyConfig>
export type AppRole = z.infer<typeof schemas.appRole>
export type PermissionsConfig = z.infer<typeof schemas.permissionsConfig>
export type ModuleConfig = z.infer<typeof schemas.moduleConfig>
export type ModulesConfig = z.infer<typeof schemas.modulesConfig>
export type ModuleClientRoute = z.infer<typeof schemas.moduleClientRoute>
export type ModuleClientRouter = z.infer<typeof schemas.moduleClientRouter>
export type ModuleManifest = z.infer<typeof schemas.moduleManifest>
export type IntegrationManifest = z.infer<typeof schemas.integrationManifest>

export type AppModule = ModuleConfig & {
  manifest: ModuleManifest
  buildProps: {
    custom: boolean
    withComponents: boolean
    withPermissions: boolean
    withTypes: boolean
    withMetadata: boolean
  }
}

export type AppIntegration = IntegrationManifest

export type AppConfigJson = {
  application: ApplicationConfig
  company: CompanyConfig
  permissions: PermissionsConfig
  modules: ModulesConfig
}

export type ComponentPortals = Record<string, ComponentRef[]>

export type RootComponentProps = { portals: ComponentPortals }

export type LayoutTabId = keyof Layout['mobile']
