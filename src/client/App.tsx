import * as React from 'react'
import { AxiosError } from 'axios'
import { useStore } from '@nanostores/react'
import { useQuery } from 'react-query'
import { ComponentRef, User } from '#shared/types'
import { Home } from '#client/components/Home'
import { Login } from '#client/components/auth/Login'
import { NotFound } from '#client/components/NotFound'
import { Layout } from '#client/components/Layout'
import { AdminHome } from '#client/components/AdminHome'
import { LoaderSpinner } from '#client/components/ui/Loader'
import config from '#client/config'
import * as stores from '#client/stores'
import { api } from '#client/utils/api'
import { getComponentInstance } from '#client/utils/portal'
import { PermissionsSet } from '#shared/utils'
import { PolkadotProvider } from '#client/components/auth/PolkadotProvider'
import { WidgetWrapper, showNotification } from './components/ui'
import { oidcErrorMessages } from '#client/components/auth/helper'

const routeGroups: Record<
  'admin' | 'public' | 'extra' | 'extraLayout',
  string[]
> = {
  admin: [],
  public: [],
  extra: [],
  extraLayout: [],
}

type ComponentContext = {
  component: React.FC<any>
  portals?: Record<string, ComponentRef[]>
}

const componentByRoute: Record<string, ComponentContext> =
  config.modules.reduce((acc, module) => {
    const accChunk: Record<string, ComponentContext> = {}
    for (const routerType in module.router) {
      const router = module.router[routerType as 'public' | 'user' | 'admin']
      for (const routeId in router) {
        const route = router[routeId]
        const componentInstance = getComponentInstance([
          module.id,
          route.componentId,
        ])
        if (!componentInstance) continue
        if (routerType === 'public') {
          routeGroups.public.push(routeId)
        } else if (routerType === 'admin') {
          routeGroups.admin.push(routeId)
        } else if (route.fullScreen) {
          routeGroups.extra.push(routeId)
        } else {
          routeGroups.extraLayout.push(routeId)
        }
        const portals: Record<string, ComponentRef[]> = {}
        for (const portalId of route.availablePortals) {
          portals[portalId] = module.portals[portalId] || []
        }
        accChunk[routeId] = {
          component: componentInstance,
          portals,
        }
      }
    }
    return { ...acc, ...accChunk }
  }, {})

type Me = {
  isAdmin: boolean
  user: User
  permissions: string[]
}
const useMe = () => {
  const path = '/user-api/users/me'
  return useQuery<Me, AxiosError>(
    path,
    async () => (await api.get<Me>(path)).data,
    {
      staleTime: 5 * 60 * 1000,
      retry: 0,
    }
  )
}

export const App = () => {
  const {
    data: fetchedMe,
    isFetching: isMeFetching,
    isError: isMeFetchingError,
  } = useMe()

  React.useEffect(() => {
    if (fetchedMe) {
      stores.setAppStateItem('me', fetchedMe.user)
      stores.setAppStateItem('isAdmin', fetchedMe.isAdmin)
      stores.permissions.set(new PermissionsSet(fetchedMe.permissions))
    }
  }, [fetchedMe])

  // Handle OIDC enrolment return: show notification and navigate to settings
  React.useEffect(() => {
    if (fetchedMe) {
      const params = new URLSearchParams(window.location.search)
      if (params.get('oidc_enrol') === 'ok') {
        showNotification('Identity successfully linked', 'success')
        params.delete('oidc_enrol')
        const clean = params.toString()
          ? `${window.location.pathname}?${params}`
          : window.location.pathname
        window.history.replaceState({}, '', clean)
        stores.goTo('settings')
      }
    }
  }, [fetchedMe])

  // Surface OIDC errors for authenticated users (e.g. enrolment failures)
  React.useEffect(() => {
    if (fetchedMe) {
      const params = new URLSearchParams(window.location.search)
      const error = params.get('error')
      if (error) {
        showNotification(
          oidcErrorMessages[error] || 'An authentication error occurred.',
          'error'
        )
        params.delete('error')
        const clean = params.toString()
          ? `${window.location.pathname}?${params}`
          : window.location.pathname
        window.history.replaceState({}, '', clean)
      }
    }
  }, [fetchedMe])

  const me = useStore(stores.me)
  const page = useStore(stores.router)
  const route = React.useMemo(() => page?.route || null, [page])

  if (route === 'login') {
    return <Login />
  }

  // @to-do make auth providers setting extendable for developers
  if (route === 'polkadot') {
    return <PolkadotProvider />
  }

  if (route && routeGroups.public.includes(route)) {
    const { component: Component, portals } = componentByRoute[route]
    return <Component portals={portals} />
  }

  if (!me && isMeFetching) {
    return <LoaderSpinner className="w-full h-full" />
  }

  if (!me && !isMeFetching && isMeFetchingError) {
    // Forward any error query param so the login page can display it
    const errorParam = new URLSearchParams(window.location.search).get('error')
    if (errorParam) {
      window.location.replace(
        '/login?error=' + encodeURIComponent(errorParam)
      )
      return null
    }
    stores.goTo('login')
    return null
  }
  if (!me) return null

  if (!route) {
    return (
      <Layout>
        <NotFound />
      </Layout>
    )
  }

  if (route === 'home') {
    return (
      <Layout>
        <Home />
      </Layout>
    )
  }

  if (routeGroups.extra.includes(route)) {
    const { component: Component, portals } = componentByRoute[route]
    return <Component portals={portals} />
  }

  if (routeGroups.extraLayout.includes(route)) {
    const { component: Component, portals } = componentByRoute[route]
    return (
      <Layout>
        <Component portals={portals} />
      </Layout>
    )
  }

  if (route === 'admin') {
    // @todo implement redirect to the latest opened and available module tab
    return (
      <Layout>
        <AdminHome>
          <WidgetWrapper>Select a module to work with</WidgetWrapper>
        </AdminHome>
      </Layout>
    )
  }

  if (routeGroups.admin.includes(route)) {
    const { component: Component, portals } = componentByRoute[route]
    return (
      <Layout>
        <AdminHome>
          <Component portals={portals} />
        </AdminHome>
      </Layout>
    )
  }

  return null
}

document.title = config.appName
