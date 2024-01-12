import { useQuery, useMutation } from 'react-query'
import { AxiosError, AxiosResponse } from 'axios'
import { api } from '#client/utils/api'
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
