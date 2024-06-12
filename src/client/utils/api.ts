import axios, { AxiosError } from 'axios'
import { showNotification } from '#client/components/ui/Notifications'
import config from '#client/config'
import * as stores from '#client/stores'

export const api = axios.create({
  baseURL: config.appHost,
  withCredentials: true,
})

const DEFAULT_PUBLIC_ROUTES = ['/login', '/polkadot']

const publicRouteIds = config.modules
  .map((m) => {
    const publicRoutes = m.router?.public || {}
    return Object.keys(publicRoutes)
  })
  .flat()

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ statusCode: number; message: string }>) => {
    if (err.response?.status === 401) {
      const router = stores.router.get()
      if (DEFAULT_PUBLIC_ROUTES.includes(router!.path)) {
        return
      }
      if (publicRouteIds.includes(router!.route)) {
        return
      }
      setTimeout(() => {
        showNotification('Your session has expired.', 'info', {
          text: 'Login',
          url: '/auth/logout',
        })
      }, 1e3)
    } else {
      if (err.code === 'ERR_NETWORK') {
        showNotification('No internet connection.', 'warning')
      } else {
        const message = err.response?.data?.message || 'Something went wrong.'
        showNotification(message, 'error')
      }
    }
    throw err
  }
)
