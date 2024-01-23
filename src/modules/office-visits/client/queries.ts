import { AxiosError } from 'axios'
import dayjs from 'dayjs'
import { useQuery } from 'react-query'
import { api } from '#client/utils/api'
import { DATE_FORMAT } from '#client/constants'
import { VisitsDailyStats } from '#shared/types'

type OfficeVisitParms = {
  officeId: string
  date: string
}

export const useOfficeVisits = (officeId: string, date: string) => {
  const path = '/user-api/office-visits/'
  return useQuery<OfficeVisitParms, AxiosError>(
    [path, { officeId, date: dayjs(date).format(DATE_FORMAT) }],
    async ({ queryKey }) =>
      (await api.get<OfficeVisitParms>(path, { params: queryKey[1] })).data,
    { enabled: !!officeId }
  )
}

export const useOfficeVisitsUpcoming = (
  officeId: string,
  date: string,
  userId?: string
) => {
  const path = '/user-api/office-visits/upcoming'
  return useQuery<any, AxiosError>(
    [path, { officeId, date: dayjs(date).format(DATE_FORMAT), userId }],
    async ({ queryKey }) =>
      (await api.get<any>(path, { params: queryKey[1] })).data,
    { enabled: !!officeId }
  )
}

export const useVisitsStatsAdmin = (
  officeId: string,
  dateRange: [string, string],
  { enabled } = { enabled: true }
) => {
  const path = '/admin-api/office-visits/stats'
  return useQuery<VisitsDailyStats[], AxiosError>(
    [path, { office: officeId, from: dateRange[0], to: dateRange[1] }],
    async ({ queryKey }) =>
      (await api.get<VisitsDailyStats[]>(path, { params: queryKey[1] })).data,
    { enabled: !!officeId && enabled }
  )
}
