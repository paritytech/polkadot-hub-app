import { AxiosError } from 'axios'
import { useQuery } from 'react-query'
import { api } from '#client/utils/api'
import { NavigationSection } from '#shared/types'

export const useQuickNavigationMetadata = () => {
  const path = `/user-api/quick-navigation/links`
  return useQuery<NavigationSection[], AxiosError>(
    path,
    async () => (await api.get<NavigationSection[]>(path)).data,
    {
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  )
}
