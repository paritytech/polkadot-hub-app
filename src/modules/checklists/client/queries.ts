import { AxiosError, AxiosResponse } from 'axios'
import { useMutation, useQuery } from 'react-query'
import { api } from '#client/utils/api'
import {
  Checklist,
  ChecklistAdminResponse,
  ChecklistAnswerUpdate,
  ChecklistCreateFields,
  ChecklistsResponse,
  EntityVisibility,
} from '#shared/types'

const moduleName = 'checklists'

const module = (type: string) => `/${type}-api/${moduleName}`

type ApiType = 'admin' | 'user' | 'public'

const URIs: Record<string, (type: ApiType, id?: string) => string> = {
  get: (type: ApiType) => `${module(type)}/checklists`,
  get_one: (type: ApiType, id: string = '') =>
    `${module(type)}/checklists/${id}`,
  post: (type: ApiType) => `${module(type)}/checklists`,
  put: (type: ApiType, id: string = '') => `${module(type)}/checklists/${id}`,
}

function get<T>(path: string, queryParams?: Record<string, string>) {
  return useQuery<T, AxiosError>(
    [path, queryParams],
    async ({ queryKey }) =>
      (await api.get<T>(path, { params: queryKey[1] })).data
  )
}

/// ADMIN

export const useChecklists = (
  visibility?: EntityVisibility | null,
  officeId?: string | null
) => {
  const params: any = {}
  if (visibility) {
    params.visibility = visibility
  }
  if (officeId) {
    params.office = officeId
  }
  return get<Checklist[]>(URIs.get('admin'), params)
}

export const useChecklist = (checklistId: string) =>
  get<ChecklistAdminResponse>(URIs.get_one('admin', checklistId), {
    checklistId,
  })

export const useCreateChecklist = (cb: () => void) =>
  useMutation<AxiosResponse, AxiosError, ChecklistCreateFields>(
    (data: ChecklistCreateFields) => api.post(URIs.post('admin'), data),
    { onSuccess: cb }
  )

export const useUpdateChecklist = (checklistId: string, cb: () => void) =>
  useMutation<AxiosResponse, AxiosError, ChecklistCreateFields>(
    (data) => api.put(URIs.put('admin', checklistId), data),
    { onSuccess: cb }
  )

/// USER

export const useMyChecklists = () => get<ChecklistsResponse>(URIs.get('user'))

export const useUpdateMyAnswers = (cb: () => void) =>
  useMutation<AxiosResponse, AxiosError, ChecklistAnswerUpdate>(
    (data: ChecklistAnswerUpdate) =>
      api.put(`${URIs.put('user', data.checklistId)}/answers`, data),
    { onSuccess: cb }
  )
