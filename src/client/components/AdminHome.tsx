import * as React from 'react'
import { useStore } from '@nanostores/react'
import * as stores from '#client/stores'
import config from '#client/config'
import { prop, propEq } from '#shared/utils/fp'
import { Button, ComponentWrapper } from '#client/components/ui'
import Permissions from '#shared/permissions'
import { DefaultPermissionPostfix } from '#shared/types'
import { PermissionsSet } from '#shared/utils'

type ModuleWithAdminComponents = {
  id: string
  name: string
  paths: string[]
}
const modulesWithAdminComponents: ModuleWithAdminComponents[] =
  config.modules.reduce((acc, m) => {
    if (!m.router.admin) return acc
    const adminRoutePaths = Object.keys(m.router.admin)
      .map((x) => m.router.admin![x])
      .map(prop('path'))
    if (adminRoutePaths.length) {
      const moduleInfo: ModuleWithAdminComponents = {
        id: m.id,
        name: m.name,
        paths: adminRoutePaths,
      }
      return [...acc, moduleInfo]
    }
    return acc
  }, [] as ModuleWithAdminComponents[])

type Props = { children: React.ReactNode }

const doesUserHaveAdminPermission = (granted: PermissionsSet) => {
  return granted.some((x) => x.endsWith(`.${DefaultPermissionPostfix.Admin}`))
}

export const AdminHome: React.FC<Props> = (props) => {
  const permissions = useStore(stores.permissions)
  const isVisible = doesUserHaveAdminPermission(permissions)
  React.useEffect(() => {
    if (!doesUserHaveAdminPermission(permissions)) {
      setTimeout(() => stores.openPage(stores.router, 'home'), 0)
    }
  }, [permissions])
  return isVisible ? <_AdminHome {...props} /> : null
}

const _AdminHome: React.FC<Props> = ({ children }) => {
  const permissions = useStore(stores.permissions)
  const page = useStore(stores.router)
  const moduleVisibilityFilter = React.useCallback(
    (m: ModuleWithAdminComponents): boolean => {
      const modulePermissions: string[] = Object.values(
        Permissions[m.id as keyof typeof Permissions] || {}
      )
      const adminPermission = `${m.id}.${DefaultPermissionPostfix.Admin}`
      return (
        permissions.has(adminPermission) &&
        modulePermissions.includes(adminPermission)
      )
    },
    [permissions]
  )

  return (
    <ComponentWrapper wide>
      <div className="-mx-8 -mt-4 sm:mt-0 px-2 sm:px-8 mb-6 pb-2 sm:pb-4 border-b border-gray-200">
        {modulesWithAdminComponents.filter(moduleVisibilityFilter).map((x) => {
          return (
            <Button
              key={x.id}
              kind={
                page?.route && x.paths.includes(page.route)
                  ? 'primary'
                  : 'secondary'
              }
              href={`/admin/${x.id}`}
              className="mb-2 sm:mb-4 mr-2 sm:mr-4 rounded-[24px] relative focus:ring-0"
            >
              {x.name}
              {/* {!!counter && <CounterBadge count={counter} />} */}
            </Button>
          )
        })}
      </div>
      {children}
    </ComponentWrapper>
  )
}

// const CounterBadge: React.FC<{ count: number }> = ({ count }) => {
//   return !!count ? (
//     <span className="absolute -top-2 right-0 border-2 border-white bg-red-500 text-white rounded-[999px] text-xs flex items-center justify-center h-[22px] min-w-[22px] px-1">
//       {count}
//     </span>
//   ) : null
// }
