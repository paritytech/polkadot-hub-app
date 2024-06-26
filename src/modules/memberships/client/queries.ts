import { useQuery, useMutation } from 'react-query'
import { AxiosError, AxiosResponse } from 'axios'
import { api } from '#client/utils/api'
import { Membership, MembershipCreationRequest } from '../types'
// import { Entity } from '#shared/types'

// export const useCreateEntity = (cb: () => void) =>
//   useMutation<AxiosResponse, AxiosError, EntityCreationRequest>(
//     (data: EntityCreationRequest) =>
//       api.post('/admin-api/<MODULE_ID>/<ENTITY>', data),
//     { onSuccess: cb }
//   )

// export const useEntities = () => {
//   const path = '/admin-api/<MODULE_ID>/<ENTITY>'
//   return useQuery<Entity[], AxiosError>(
//     path,
//     async () => (await api.get<Entity[]>(path)).data
//   )
// }

export const useMemberships = (officeId?: string | null) => {
  const path = '/user-api/memberships/memberships'
  // TEMP:
  const params: any = {}
  if (officeId) {
    params.office = officeId
  }
  return useQuery<any[], AxiosError>(
    [path, params],
    async ({ queryKey }) =>
      (await api.get<any[]>(path, { params: queryKey[1] })).data
  )
}

export const useMembershipsAdmin = (officeId?: string | null) => {
  const path = '/admin-api/memberships/memberships'
  // TEMP:
  const params: any = {}
  if (officeId) {
    params.office = officeId
  }
  return useQuery<any[], AxiosError>(
    [path, params],
    async ({ queryKey }) =>
      (await api.get<any[]>(path, { params: queryKey[1] })).data
  )
}

export const useMembershipAdmin = (membershipId: string | null) => {
  const path = `/admin-api/memberships/memberships/${membershipId}`
  return useQuery<Membership, AxiosError>(
    path,
    async () => (await api.get<Membership>(path)).data,
    { enabled: !!membershipId && membershipId !== 'new' }
  )
}

export const useCreateMembership = (cb: () => void) =>
  useMutation<AxiosResponse, AxiosError, MembershipCreationRequest>(
    (data) => api.post(`/admin-api/memberships/memberships`, data),
    { onSuccess: cb }
  )

export const useUpdateMembership = (membershipId: string, cb: () => void) =>
  useMutation<AxiosResponse, AxiosError, MembershipCreationRequest>(
    (data) =>
      api.put(`/admin-api/memberships/memberships/${membershipId}`, data),
    { onSuccess: cb }
  )
