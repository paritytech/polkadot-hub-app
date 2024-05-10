import * as React from 'react'
import { useStore } from '@nanostores/react'
import { useQuery } from 'react-query'
import * as stores from '#client/stores'
import config from '#client/config'
import {
  ADMIN_ACCESS_PERMISSION_RE,
  ADMIN_ACCESS_PERMISSION_POSTFIX,
} from '#client/constants'
import { WidgetWrapper } from '#client/components/ui'
import Permissions from '#shared/permissions'
import { PermissionsSet } from '#shared/utils'
import { cn } from '#client/utils'
import { api } from '#client/utils/api'

type ModuleWithAdminComponents = {
  id: string
  name: string
  routes: string[]
  counter: boolean
}
const modulesWithAdminComponents: ModuleWithAdminComponents[] =
  config.modules.reduce((acc, m) => {
    if (!m.router.admin) return acc
    const routes = Object.keys(m.router.admin)
    if (routes.length) {
      const moduleInfo: ModuleWithAdminComponents = {
        id: m.id,
        name: m.name,
        routes,
        counter: m.adminLinkCounter,
      }
      return [...acc, moduleInfo]
    }
    return acc
  }, [] as ModuleWithAdminComponents[])

type Props = { children: React.ReactNode }

const doesUserHaveAdminPermission = (granted: PermissionsSet) => {
  return granted.some((x) => ADMIN_ACCESS_PERMISSION_RE.test(x))
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
  const officeId = useStore(stores.officeId)
  const layoutView = useStore(stores.layoutView)

  const filteredModules = React.useMemo(() => {
    return modulesWithAdminComponents.filter((m) => {
      const modulePermissions: string[] = Object.values(
        Permissions[m.id as keyof typeof Permissions] || {}
      )
      const adminPermission = `${m.id}.${ADMIN_ACCESS_PERMISSION_POSTFIX}`
      const adminPermissionPerOffice = `${adminPermission}:${officeId}`
      return (
        modulePermissions.includes(adminPermission) &&
        (permissions.has(adminPermissionPerOffice) ||
          permissions.has(adminPermission))
      )
    })
  }, [permissions, officeId])

  if (!filteredModules.length) {
    return (
      <WidgetWrapper>
        Please select an office that you can work with.
      </WidgetWrapper>
    )
  }

  if (layoutView === 'desktop') {
    return (
      <div className="grid grid-cols-[240px_minmax(0,auto)] gap-x-4">
        <div>
          <WidgetWrapper className="p-2 sticky top-2 flex flex-col gap-y-1">
            {filteredModules.map((x, i) => {
              const isActive = !!(page && x.routes.includes(page.route))
              return <ModuleLink key={x.id} isActive={isActive} module={x} />
            })}
          </WidgetWrapper>
        </div>
        <div>
          <div>{children}</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <WidgetWrapper className="p-2 ">
        <div className="flex flex-wrap -mb-1 -mr-1">
          {filteredModules.map((x, i) => {
            const isActive = !!(page && x.routes.includes(page.route))
            return (
              <ModuleLink
                key={x.id}
                isActive={isActive}
                module={x}
                className="mr-1 mb-1"
              />
            )
          })}
        </div>
      </WidgetWrapper>
      <div>{children}</div>
    </div>
  )
}

const ModuleLink: React.FC<{
  isActive: boolean
  module: ModuleWithAdminComponents
  className?: string
}> = (props) => {
  const officeId = useStore(stores.officeId)
  const counterApiUri = `/admin-api/${props.module.id}/counter`

  const { data: count = 0 } = useQuery<number>(
    [counterApiUri, { office: officeId }],
    async ({ queryKey }) =>
      (await api.get<number>(counterApiUri, { params: queryKey[1] })).data,
    { retry: false, enabled: props.module.counter }
  )

  return (
    <a
      href={`/admin/${props.module.id}`}
      className={cn(
        'relative flex items-center px-4 py-3 rounded-tiny hover:bg-gray-50',
        props.isActive &&
          'bg-purple-50 hover:bg-purple-50 bg-opacity-40 hover:bg-opacity-40 text-purple-500',
        props.className
      )}
    >
      <span className="flex-1 text-ellipsis overflow-hidden mr-1 whitespace-nowrap">
        {props.module.name}
      </span>
      <CounterBadge count={count} />
    </a>
  )
}

const CounterBadge: React.FC<{ count: number }> = ({ count }) => {
  if (!count) return null
  return (
    <span className="bg-purple-500 text-white rounded-[999px] text-xs inline-flex items-center justify-center h-[18px] min-w-[18px] px-1">
      {count}
    </span>
  )
}
