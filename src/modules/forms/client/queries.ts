import { AxiosError, AxiosResponse } from 'axios'
import { useMutation, useQuery } from 'react-query'
import { api } from '#client/utils/api'
import {
  Form,
  FormAdminResponse,
  FormCreationRequest,
  FormSubmission,
  FormSubmissionRequest,
  PublicForm,
  PublicFormSubmission,
  User,
  EntityVisibility,
} from '#shared/types'

export const useForms = (visibility?: EntityVisibility | null) => {
  const path = '/admin-api/forms/form'
  // TEMP:
  const params: any = {}
  if (visibility) {
    params.visibility = visibility
  }
  return useQuery<FormAdminResponse[], AxiosError>(
    [path, params],
    async ({ queryKey }) =>
      (await api.get<FormAdminResponse[]>(path, { params: queryKey[1] })).data
  )
}

export const useForm = (
  formId: string | null,
  options: { retry: boolean } = { retry: true }
) => {
  const path = `/admin-api/forms/form/${formId}`
  return useQuery<Form, AxiosError>(
    path,
    async () => (await api.get<Form>(path)).data,
    {
      enabled: !!formId,
      retry: options.retry,
    }
  )
}

export const useCreateForm = (cb: () => void) =>
  useMutation<AxiosResponse, AxiosError, FormCreationRequest>(
    (data) => api.post('/admin-api/forms/form', data),
    { onSuccess: cb }
  )

export const useUpdateForm = (formId: string | null, cb: () => void) => {
  const path = `/admin-api/forms/form/${formId}`
  return useMutation<AxiosResponse, AxiosError, FormCreationRequest>(
    (data) => api.put(path, data),
    { onSuccess: cb }
  )
}

export const useDeleteForm = (cb: () => void) => {
  return useMutation<AxiosResponse, AxiosError, string>(
    (formId: string) => api.delete(`/admin-api/forms/form/${formId}`),
    { onSuccess: cb }
  )
}

export const useDuplicateForm = (cb: () => void) =>
  useMutation<AxiosResponse, AxiosError, string>(
    (formId: string | null) =>
      api.post(`/admin-api/forms/form/${formId}/duplicate`),
    { onSuccess: cb }
  )

export const useFormPublic = (formId: string | null) => {
  const path = `/public-api/forms/form/${formId}`
  return useQuery<PublicForm, AxiosError>(
    path,
    async () => (await api.get<PublicForm>(path)).data,
    { retry: false, enabled: !!formId }
  )
}

export const useFormSubmissionPublic = (
  formId: string | null,
  opts: { enabled?: boolean } = { enabled: false }
) => {
  const path = `/user-api/forms/form/${formId}/submission`
  return useQuery<PublicFormSubmission, AxiosError>(
    path,
    async () => (await api.get<PublicFormSubmission>(path)).data,
    {
      retry: false,
      enabled: opts.enabled,
    }
  )
}

export const useSubmitForm = (formId: string | null, cb: () => void) => {
  const path = `/public-api/forms/form/${formId}`
  return useMutation<AxiosResponse, AxiosError, FormSubmissionRequest>(
    (data) => api.post(path, data),
    { onSuccess: cb }
  )
}

export const useFormSubmissions = (formId: string | null) => {
  const path = `/admin-api/forms/form/${formId}/submissions`
  return useQuery<FormSubmission[], AxiosError>(
    path,
    async () => (await api.get<FormSubmission[]>(path)).data,
    { enabled: !!formId }
  )
}

export const useFormSubmission = (
  formId: string | null,
  formSubmissionId: string | null
) => {
  const path = `/admin-api/forms/form/${formId}/submissions/${formSubmissionId}`
  return useQuery<FormSubmission, AxiosError>(
    path,
    async () => (await api.get<FormSubmission>(path)).data,
    { enabled: !!(formId && formSubmissionId) }
  )
}

export const useDeleteFormSubmission = (
  formId: string | null,
  cb: () => void
) => {
  return useMutation<AxiosResponse, AxiosError, string>(
    (formSubmissionId) =>
      api.delete(
        `/admin-api/forms/form/${formId}/submissions/${formSubmissionId}`
      ),
    { onSuccess: cb }
  )
}

export const useUpdateFormSubmission = (
  formId: string | null,
  formSubmissionId: string | null,
  cb: () => void
) => {
  return useMutation<
    AxiosResponse,
    AxiosError,
    Pick<FormSubmission, 'answers' | 'metadata'>
  >(
    (data) =>
      api.put(
        `/admin-api/forms/form/${formId}/submissions/${formSubmissionId}`,
        data
      ),
    { onSuccess: cb }
  )
}

export const useResponsibleUsers = () => {
  const path = `/admin-api/forms/responsible-users`
  return useQuery<User[], AxiosError>(
    path,
    async () => (await api.get<User[]>(path)).data
  )
}
