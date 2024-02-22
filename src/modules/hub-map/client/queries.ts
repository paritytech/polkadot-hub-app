import { useQuery } from 'react-query'
import { AxiosError } from 'axios'
import { api } from '#client/utils/api'
import dayjs from 'dayjs'
import { DATE_FORMAT } from '#server/constants'

export const useUpcoming = (
  officeId: string,
  date: string,
  userId?: string
) => {
  const path = '/user-api/hub-map/upcoming'
  return useQuery<any, AxiosError>(
    [path, { officeId, date: dayjs(date).format(DATE_FORMAT), userId }],
    async ({ queryKey }) =>
      (await api.get<any>(path, { params: queryKey[1] })).data,
    { enabled: !!officeId }
  )
}
