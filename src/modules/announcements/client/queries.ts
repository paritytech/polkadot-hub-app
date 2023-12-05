import { useQuery, useMutation } from 'react-query'
import { AxiosError, AxiosResponse } from 'axios'
import { api } from '#client/utils/api'
import { AnnouncementItem, AnnouncementItemRequest } from '../types'

////////// USER API //////////

export const useActiveAnnouncements = (officeId: string) => {
  const path = '/user-api/announcements/active'
  return useQuery<AnnouncementItem[], AxiosError>(
    [path, { office: officeId }],
    async ({ queryKey }) =>
      (await api.get<AnnouncementItem[]>(path, { params: queryKey[1] })).data
  )
}

////////// ADMIN API //////////

export const useAdminAnnouncements = (officeId: string) => {
  const path = '/admin-api/announcements/'
  return useQuery<AnnouncementItem[], AxiosError>(
    [path, { office: officeId }],
    async ({ queryKey }) =>
      (await api.get<AnnouncementItem[]>(path, { params: queryKey[1] })).data
  )
}

export const useAnnouncement = (announcementId: string) => {
  const path = `/admin-api/announcements/${announcementId}`
  return useQuery<AnnouncementItem, AxiosError>(
    path,
    async () => (await api.get<AnnouncementItem>(path)).data
  )
}

export const useCreateAnnouncement = (cb: () => void) =>
  useMutation<AxiosResponse, AxiosError, any>(
    (data: AnnouncementItemRequest) => {
      return api.post('/admin-api/announcements/announcements', data)
    },
    { onSuccess: cb }
  )

export const useUpdateAnnouncement = (announcementId: string, cb: () => void) =>
  useMutation<AxiosResponse, AxiosError, any>(
    (data: AnnouncementItemRequest) => {
      return api.put(
        `/admin-api/announcements/announcements/${announcementId}`,
        data
      )
    },
    { onSuccess: cb }
  )
