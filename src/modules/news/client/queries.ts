import { AxiosError, AxiosResponse } from 'axios'
import { useMutation, useQuery } from 'react-query'
import { api } from '#client/utils/api'
import { NewsItem } from '#shared/types'

////////// USER API //////////

export const useNews = (officeId: string) => {
  const path = '/user-api/news/news'
  return useQuery<NewsItem[], AxiosError>(
    [path, { office: officeId }],
    async ({ queryKey }) =>
      (await api.get<NewsItem[]>(path, { params: queryKey[1] })).data
  )
}

export const useNewsArticle = (newsId: string | null) => {
  const path = `/user-api/news/news/${newsId}`
  return useQuery<NewsItem, AxiosError>(
    path,
    async () => (await api.get<NewsItem>(path)).data,
    { enabled: !!newsId }
  )
}

////////// ADMIN API //////////

export const useAdminNews = (officeId: string) => {
  const path = '/admin-api/news/news'
  return useQuery<NewsItem[], AxiosError>(
    [path, { office: officeId }],
    async ({ queryKey }) =>
      (await api.get<NewsItem[]>(path, { params: queryKey[1] })).data
  )
}

export const useAdminNewsArticle = (newsId: string | null) => {
  const path = `/admin-api/news/news/${newsId}`
  return useQuery<NewsItem, AxiosError>(
    path,
    async () => (await api.get<NewsItem>(path)).data,
    { enabled: !!newsId }
  )
}

export const useCreateNews = (cb: () => void) =>
  useMutation<AxiosResponse, AxiosError, any>(
    (data: Pick<NewsItem, 'title' | 'content' | 'offices'>) => {
      return api.post('/admin-api/news/news', data)
    },
    { onSuccess: cb }
  )

export const useUpdateNews = (newsId: string, cb: () => void) =>
  useMutation<AxiosResponse, AxiosError, any>(
    (data: Pick<NewsItem, 'title' | 'content' | 'offices'>) => {
      return api.put(`/admin-api/news/news/${newsId}`, data)
    },
    { onSuccess: cb }
  )
