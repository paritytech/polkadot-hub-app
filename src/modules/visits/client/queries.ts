import { useQuery, useMutation } from 'react-query'
import { AxiosError, AxiosResponse } from 'axios'
import { api } from '#client/utils/api'
import {
  Visit,
  VisitsOccupancy,
  VisitsCreationRequest,
  VisitStatus,
  OfficeArea,
  Office,
  OfficeVisitor,
  VisitsAdminDashboardStats,
} from '#shared/types'

export const useVisits = (
  officeId: string,
  dates: string[] = [],
  opts: { retry: boolean } = { retry: true }
) => {
  const path = '/user-api/visits/visits'
  return useQuery<Visit[], AxiosError>(
    [path, { office: officeId, dates: dates.length ? dates : undefined }],
    async ({ queryKey }) =>
      (await api.get<Visit[]>(path, { params: queryKey[1] })).data,
    { retry: opts.retry }
  )
}

export const useVisit = (visitId: string) => {
  const path = `/user-api/visits/visits/${visitId}`
  return useQuery<Visit, AxiosError>(
    path,
    async () => (await api.get<Visit>(path)).data,
    { enabled: !!visitId }
  )
}

export const useVisitsAdmin = (officeId: string, dates: string[] = []) => {
  const path = '/admin-api/visits/visits'
  return useQuery<Visit[], AxiosError>(
    [path, { office: officeId, dates: dates.length ? dates : undefined }],
    async ({ queryKey }) =>
      (await api.get<Visit[]>(path, { params: queryKey[1] })).data
  )
}

export const useUpdateVisitAdmin = (cb: () => void) => {
  return useMutation<
    AxiosResponse,
    AxiosError,
    { id: string; status: VisitStatus }
  >(
    ({ id, status }) =>
      api.put<any>(`/admin-api/visits/visits/${id}`, { status }),
    { onSuccess: cb }
  )
}

export const useUpdateVisit = (cb: () => void) => {
  return useMutation<
    AxiosResponse,
    AxiosError,
    { id: string; status: VisitStatus }
  >(
    ({ id, status }) =>
      api.put<any>(`/user-api/visits/visits/${id}`, { status }),
    { onSuccess: cb }
  )
}

export const useVisitsOccupancy = (officeId: string) => {
  const path = '/user-api/visits/occupancy'
  return useQuery<VisitsOccupancy, AxiosError>(
    [path, { office: officeId }],
    async ({ queryKey }) =>
      (await api.get<VisitsOccupancy>(path, { params: queryKey[1] })).data
  )
}

export const useVisitsAreas = (
  officeId: string,
  { enabled } = { enabled: true }
) => {
  const path = '/user-api/visits/areas'
  return useQuery<OfficeArea[], AxiosError>(
    [path, { office: officeId }],
    async ({ queryKey }) =>
      (await api.get<OfficeArea[]>(path, { params: queryKey[1] })).data,
    { enabled: !!officeId && enabled }
  )
}

export const useCreateVisit = (cb: () => void) =>
  useMutation<AxiosResponse, AxiosError, VisitsCreationRequest>(
    (data: VisitsCreationRequest) => api.post('/user-api/visits/visit', data),
    { onSuccess: cb }
  )

export const useAvailableDesks = (officeId: string, dates: string[]) => {
  const path = '/user-api/visits/free-desks'
  return useQuery<Array<{ areaId: string; deskId: string }>, AxiosError>(
    [path, { office: officeId, dates }],
    async ({ queryKey }) =>
      (
        await api.get<Array<{ areaId: string; deskId: string }>>(path, {
          params: queryKey[1],
        })
      ).data,
    { enabled: !!dates.length && !!officeId, keepPreviousData: true }
  )
}

export const useVisitConfig = (officeId: string | null) => {
  const path = '/public-api/visits/config'
  return useQuery<Office['visitsConfig'], AxiosError>(
    [path, { office: officeId }],
    async ({ queryKey }) =>
      (
        await api.get<Office['visitsConfig']>(path, {
          params: queryKey[1],
        })
      ).data,
    { retry: false, enabled: !!officeId }
  )
}

export const useOfficeVisitors = (
  officeId: string,
  date: string
  // opts: { retry: boolean } = { retry: true }
) => {
  const path = '/user-api/visits/visitors'
  return useQuery<OfficeVisitor[], AxiosError>(
    [path, { office: officeId, date }],
    async ({ queryKey }) =>
      (await api.get<OfficeVisitor[]>(path, { params: queryKey[1] })).data
    // { retry: opts.retry }
  )
}

export const useToggleStealthMode = (cb: () => void) =>
  useMutation<AxiosResponse, AxiosError, { stealthMode: boolean }>(
    (data: { stealthMode: boolean }) =>
      api.post('/user-api/visits/stealth', data),
    { onSuccess: cb }
  )

export const useVisitNotice = (officeId: string) => {
  const path = `/user-api/visits/notice`
  return useQuery<string | null, AxiosError>(
    [path, { office: officeId }],
    async ({ queryKey }) =>
      (await api.get<string | null>(path, { params: queryKey[1] })).data
  )
}

export const useAdminDashboardStats = (
  startDate: string,
  endDate: string,
  officeId: string,
  opts: { enabled: boolean } = { enabled: true }
) => {
  const path = '/admin-api/visits/admin-dashboard-stats'
  return useQuery<VisitsAdminDashboardStats, AxiosError>(
    [path, { startDate, endDate, office: officeId }],
    async ({ queryKey }) =>
      (await api.get<VisitsAdminDashboardStats>(path, { params: queryKey[1] }))
        .data,
    { enabled: opts.enabled }
  )
}
