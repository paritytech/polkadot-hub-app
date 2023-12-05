import { showNotification } from '#client/components/ui/Notifications'
import config from '#client/config'
import axios, { AxiosError } from 'axios'

export const api = axios.create({
  baseURL: config.appHost,
  withCredentials: true,
})

api.interceptors.response.use((res) => res, (err: AxiosError<{ statusCode: number; message: string }>) => {
  if (err.response?.data?.statusCode !== 401) {
    if (err.code === 'ERR_NETWORK') {
      showNotification('No internet connection.', 'warning')
    } else {
      const message = err.response?.data?.message || 'Something went wrong.'
      showNotification(message, 'error')
    }
  }
  throw err
})
