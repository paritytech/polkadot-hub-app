import { useQuery, useMutation } from 'react-query'
import { AxiosError, AxiosResponse } from 'axios'
import { api } from '#client/utils/api'
import dayjs from 'dayjs'
import { DATE_FORMAT } from '#server/constants'
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
