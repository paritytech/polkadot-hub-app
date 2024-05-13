import { useQuery, useMutation } from 'react-query'
import { AxiosError, AxiosResponse } from 'axios'
import { api } from '#client/utils/api'
import {
  AdminWorkingHoursConfig,
  DefaultWorkingHoursEntry,
  DefaultWorkingHoursEntryCreationRequest,
  DefaultWorkingHoursEntryUpdateRequest,
  PublicHoliday,
  TimeOffRequest,
  WorkingHoursConfig,
  WorkingHoursEntry,
  WorkingHoursEntryCreationRequest,
  WorkingHoursEntryUpdateRequest,
  WorkingHoursUserConfig,
} from '#shared/types'

export const useConfig = () => {
  const path = '/user-api/working-hours/config'
  return useQuery<WorkingHoursConfig, AxiosError>(
    path,
    async () => (await api.get<WorkingHoursConfig>(path)).data,
    {
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  )
}

// WorkingHoursEntries

export const useCreateEntries = (cb: () => void) => {
  return useMutation<
    AxiosResponse,
    AxiosError,
    WorkingHoursEntryCreationRequest[]
  >(
    (data: WorkingHoursEntryCreationRequest[]) =>
      api.post('/user-api/working-hours/entries', data),
    {
      onSuccess: cb,
    }
  )
}

export const useEntries = (
  startDate: string,
  endDate: string,
  opts: { enabled: boolean } = { enabled: true }
) => {
  const path = '/user-api/working-hours/entries'
  return useQuery<WorkingHoursEntry[], AxiosError>(
    [path, { startDate, endDate }],
    async ({ queryKey }) =>
      (await api.get<WorkingHoursEntry[]>(path, { params: queryKey[1] })).data,
    { enabled: opts.enabled }
  )
}

export const useDeleteEntry = (cb: () => void) => {
  return useMutation<AxiosResponse, AxiosError, string>(
    (entryId) => api.delete(`/user-api/working-hours/entries/${entryId}`),
    { onSuccess: cb }
  )
}

export const useUpdateEntry = (cb: () => void) => {
  return useMutation<AxiosResponse, AxiosError, WorkingHoursEntryUpdateRequest>(
    (data) => api.put<any>(`/user-api/working-hours/entries/${data.id}`, data),
    { onSuccess: cb }
  )
}

// DefaultWorkingHoursEntries

export const useCreateDefaultEntry = (cb: () => void) => {
  return useMutation<
    AxiosResponse,
    AxiosError,
    DefaultWorkingHoursEntryCreationRequest
  >(
    (data: DefaultWorkingHoursEntryCreationRequest) =>
      api.post('/user-api/working-hours/default-entries', data),
    { onSuccess: cb }
  )
}

export const useDefaultEntries = (
  opts: { enabled: boolean } = { enabled: true }
) => {
  const path = '/user-api/working-hours/default-entries'
  return useQuery<DefaultWorkingHoursEntry[], AxiosError>(
    path,
    async () => (await api.get<WorkingHoursEntry[]>(path)).data,
    { enabled: opts.enabled }
  )
}

export const useDeleteDefaultEntry = (cb: () => void) => {
  return useMutation<AxiosResponse, AxiosError, string>(
    (entryId) =>
      api.delete(`/user-api/working-hours/default-entries/${entryId}`),
    { onSuccess: cb }
  )
}

export const useUpdateDefaultEntry = (cb: () => void) => {
  return useMutation<
    AxiosResponse,
    AxiosError,
    DefaultWorkingHoursEntryUpdateRequest
  >(
    (data) =>
      api.put<any>(`/user-api/working-hours/default-entries/${data.id}`, data),
    { onSuccess: cb }
  )
}

// Time-off requests

export const useTimeOffRequests = (
  startDate: string,
  endDate: string,
  opts: { enabled: boolean } = { enabled: true }
) => {
  const path = '/user-api/working-hours/time-off-requests'
  return useQuery<TimeOffRequest[], AxiosError>(
    [path, { startDate, endDate }],
    async ({ queryKey }) =>
      (await api.get<TimeOffRequest[]>(path, { params: queryKey[1] })).data,
    { enabled: opts.enabled }
  )
}

// Public Holidays
export const usePublicHolidays = (
  startDate: string,
  endDate: string,
  opts: { enabled: boolean } = { enabled: true }
) => {
  const path = '/user-api/working-hours/public-holidays'
  return useQuery<PublicHoliday[], AxiosError>(
    [path, { startDate, endDate }],
    async ({ queryKey }) =>
      (await api.get<PublicHoliday[]>(path, { params: queryKey[1] })).data,
    { enabled: opts.enabled }
  )
}

// Admin

export const useAdminEntries = (
  startDate: string | null,
  endDate: string | null,
  userId: string | null,
  opts: { enabled: boolean } = { enabled: true }
) => {
  const path = '/admin-api/working-hours/entries'
  const queryParams: { startDate?: string; endDate?: string; userId?: string } =
    {}
  if (startDate) queryParams.startDate = startDate
  if (endDate) queryParams.endDate = endDate
  if (userId) queryParams.userId = userId
  return useQuery<WorkingHoursEntry[], AxiosError>(
    [path, queryParams],
    async ({ queryKey }) =>
      (await api.get<WorkingHoursEntry[]>(path, { params: queryKey[1] })).data,
    { enabled: opts.enabled }
  )
}

export const useAdminTimeOffRequests = (
  startDate: string | null,
  endDate: string | null,
  userId: string | null,
  opts: { enabled: boolean } = { enabled: true }
) => {
  const path = '/admin-api/working-hours/time-off-requests'
  const queryParams: { startDate?: string; endDate?: string; userId?: string } =
    {}
  if (startDate) queryParams.startDate = startDate
  if (endDate) queryParams.endDate = endDate
  if (userId) queryParams.userId = userId
  return useQuery<TimeOffRequest[], AxiosError>(
    [path, queryParams],
    async ({ queryKey }) =>
      (await api.get<TimeOffRequest[]>(path, { params: queryKey[1] })).data,
    { enabled: opts.enabled }
  )
}

export const useAdminPublicHolidays = (
  startDate: string | null,
  endDate: string | null,
  calendarId: string | null,
  opts: { enabled: boolean } = { enabled: true }
) => {
  const path = '/admin-api/working-hours/public-holidays'
  const queryParams: {
    startDate?: string
    endDate?: string
    calendarId?: string
  } = {}
  if (startDate) queryParams.startDate = startDate
  if (endDate) queryParams.endDate = endDate
  if (calendarId) queryParams.calendarId = calendarId
  return useQuery<PublicHoliday[], AxiosError>(
    [path, queryParams],
    async ({ queryKey }) =>
      (await api.get<PublicHoliday[]>(path, { params: queryKey[1] })).data,
    { enabled: opts.enabled }
  )
}

export const useAdminConfig = () => {
  const path = '/admin-api/working-hours/config'
  return useQuery<AdminWorkingHoursConfig, AxiosError>(
    path,
    async () => (await api.get<AdminWorkingHoursConfig>(path)).data,
    {
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  )
}

export const useAdminUserConfigs = (
  opts:
    | {
        userId: string
      }
    | { role: string }
) => {
  const path = '/admin-api/working-hours/user-configs'
  const query: { userId?: string; role?: string } = {}
  if ('userId' in opts) {
    query.userId = opts.userId
  }
  if ('role' in opts) {
    query.role = opts.role
  }
  return useQuery<WorkingHoursUserConfig[], AxiosError>(
    [path, query],
    async ({ queryKey }) =>
      (await api.get<WorkingHoursUserConfig[]>(path, { params: queryKey[1] }))
        .data,
    { enabled: !!query.userId || !!query.role }
  )
}
