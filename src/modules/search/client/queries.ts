import { useQuery, useMutation } from 'react-query'
import { AxiosError, AxiosResponse } from 'axios'
import { api } from '#client/utils/api'
import { SearchSuggestion } from '#shared/types'


export const useSearchSuggestions = (query: string, opts: { enabled: boolean } = { enabled: true }) => {
  const path = '/user-api/search/suggestion'
  return useQuery<SearchSuggestion[], AxiosError>(
    [path, { query }],
    async ({ queryKey }) => (await api.get<SearchSuggestion[]>(path, { params: queryKey[1] })).data,
    { enabled: opts.enabled && !!query.trim() }
  )
}

export const useSearchResults = (query: string, opts: { enabled: boolean } = { enabled: true }) => {
  const path = '/user-api/search/results'
  return useQuery<SearchSuggestion[], AxiosError>(
    [path, { query }],
    async ({ queryKey }) => (await api.get<SearchSuggestion[]>(path, { params: queryKey[1] })).data,
    { enabled: opts.enabled && !!query.trim() }
  )
}
