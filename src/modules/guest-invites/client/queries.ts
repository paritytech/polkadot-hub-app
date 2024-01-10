import { AxiosError, AxiosResponse } from 'axios'
import { useMutation, useQuery } from 'react-query'
import { api } from '#client/utils/api'
import {
  GuestInvite,
  GuestInviteGuestRequest,
  GuestInviteOfficeRule,
  GuestInviteRequest,
  GuestInviteStatus,
  GuestInviteUpdateRequest,
  PublicGuestInvite,
} from '#shared/types'

export const useCreateGuestInvite = (officeId: string, cb: () => void) =>
  useMutation<AxiosResponse, AxiosError, GuestInviteRequest>(
    (data: GuestInviteRequest) =>
      api.post(
        `/user-api/guest-invites/invite?office=${encodeURIComponent(officeId)}`,
        data
      ),
    { onSuccess: cb }
  )

export const useGuestInvitePublic = (guestInviteCode: string | null) => {
  const path = `/public-api/guest-invites/invite/${guestInviteCode}`
  return useQuery<PublicGuestInvite, AxiosError>(
    path,
    async () => (await api.get<PublicGuestInvite>(path)).data,
    {
      enabled: !!guestInviteCode,
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  )
}

export const useGuestInviteRules = (guestInviteCode: string | null) => {
  const path = `/public-api/guest-invites/invite/${guestInviteCode}/rules`
  return useQuery<GuestInviteOfficeRule[], AxiosError>(
    path,
    async () => (await api.get<GuestInviteOfficeRule[]>(path)).data,
    {
      enabled: !!guestInviteCode,
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  )
}

export const useOpenGuestInvitePublic = (
  guestInviteCode: string | null,
  cb: () => void
) =>
  useMutation<AxiosResponse, AxiosError, GuestInviteGuestRequest>(
    (data: GuestInviteGuestRequest) =>
      api.post(`/public-api/guest-invites/invite/${guestInviteCode}`, data),
    { onSuccess: cb }
  )

export const useGuestInvitesAdmin = (officeId: string | null) => {
  const path = `/admin-api/guest-invites/invite`
  return useQuery<GuestInvite[], AxiosError>(
    [path, { office: officeId }],
    async ({ queryKey }) =>
      (await api.get<GuestInvite[]>(path, { params: queryKey[1] })).data,
    { enabled: !!officeId }
  )
}

export const useGuestInviteAdmin = (inviteId: string | null) => {
  const path = `/admin-api/guest-invites/invite/${inviteId}`
  return useQuery<GuestInvite, AxiosError>(
    path,
    async () => (await api.get<GuestInvite>(path)).data,
    { enabled: !!inviteId }
  )
}

export const useUpdateGuestInvite = (cb: () => void) =>
  useMutation<
    AxiosResponse,
    AxiosError,
    { id: string; data: GuestInviteUpdateRequest }
  >(({ id, data }) => api.put(`/admin-api/guest-invites/invite/${id}`, data), {
    onSuccess: cb,
  })

export const useUpdateGuestInviteByUser = (cb: () => void) =>
  useMutation<
    AxiosResponse,
    AxiosError,
    { id: string; status: GuestInviteStatus }
  >(({ id, status }) => api.put(`/user-api/guest-invites/${id}`, { status }), {
    onSuccess: cb,
  })

export const useGuestInvite = (inviteId: string | null) => {
  const path = `/user-api/guest-invites/invite/${inviteId}`
  return useQuery<GuestInvite, AxiosError>(
    path,
    async () => (await api.get<GuestInvite>(path)).data,
    { enabled: !!inviteId }
  )
}

export const useCreateGuestInviteAdmin = (officeId: string, cb: () => void) =>
  useMutation<AxiosResponse, AxiosError, GuestInvite>(
    (data: GuestInvite) =>
      api.post(
        `/admin-api/guest-invites/invite?office=${encodeURIComponent(
          officeId
        )}`,
        data
      ),
    { onSuccess: cb }
  )

export const useUpdateGuestInviteAdmin = (cb: () => void) =>
  useMutation<AxiosResponse, AxiosError, { id: string; data: GuestInvite }>(
    ({ id, data }) => api.put(`/admin-api/guest-invites/invite/${id}`, data),
    {
      onSuccess: cb,
    }
  )
