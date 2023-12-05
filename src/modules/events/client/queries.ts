import { AxiosError, AxiosResponse } from 'axios'
import { useMutation, useQuery } from 'react-query'
import { api } from '#client/utils/api'
import {
  EntityVisibility,
  Event,
  EventAdminResponse,
  EventApplication,
  EventApplicationStatus,
  EventCreationRequest,
  EventMetadata,
  EventParticipant,
  EventPreview,
  EventPublicResponse,
  EventToogleCheckboxRequest,
  FormSubmissionRequest,
  GlobalEvent,
  PublicForm,
  User,
} from '#shared/types'

export const useEventsAdmin = (
  visibility?: EntityVisibility | null,
  officeId?: string | null
) => {
  const path = '/admin-api/events/event'
  // TEMP:
  const params: any = {}
  if (visibility) {
    params.visibility = visibility
  }
  if (officeId) {
    params.office = officeId
  }
  return useQuery<EventAdminResponse[], AxiosError>(
    [path, params],
    async ({ queryKey }) =>
      (await api.get<EventAdminResponse[]>(path, { params: queryKey[1] })).data
  )
}

export const useUpcomingEvents = (officeId: string | null) => {
  const path = '/user-api/events/event'
  return useQuery<EventPublicResponse[], AxiosError>(
    [path, { office: officeId }],
    async ({ queryKey }) =>
      (await api.get<EventPublicResponse[]>(path, { params: queryKey[1] }))
        .data,
    { enabled: !!officeId }
  )
}

export const useMyEvents = (officeId: string | null) => {
  const path = '/user-api/events/event/me'
  return useQuery<Event[], AxiosError>(
    [path, { office: officeId }],
    async ({ queryKey }) =>
      (await api.get<Event[]>(path, { params: queryKey[1] })).data,
    { enabled: !!officeId }
  )
}

export const useUncompletedActions = (officeId: string | null) => {
  const path = '/user-api/events/event/uncompleted'
  return useQuery<Event[], AxiosError>(
    [path, { office: officeId }],
    async ({ queryKey }) =>
      (await api.get<Event[]>(path, { params: queryKey[1] })).data,
    { enabled: !!officeId }
  )
}

export const useEvent = (eventId: string | null) => {
  const path = `/admin-api/events/event/${eventId}`
  return useQuery<Event, AxiosError>(
    path,
    async () => (await api.get<Event>(path)).data,
    { enabled: !!eventId }
  )
}

export const useCreateEvent = (cb: () => void) =>
  useMutation<AxiosResponse, AxiosError, EventCreationRequest>(
    (data) => api.post(`/admin-api/events/event`, data),
    { onSuccess: cb }
  )

export const useUpdateEvent = (eventId: string, cb: () => void) =>
  useMutation<AxiosResponse, AxiosError, EventCreationRequest>(
    (data) => api.put(`/admin-api/events/event/${eventId}`, data),
    { onSuccess: cb }
  )

// @todo implement soft deletion
// export const useDeleteEvent = (cb: () => void) =>
//   useMutation<AxiosResponse, AxiosError, string>(
//     (id: string) => api.delete(`/admin-api/events/event/${id}`),
//     { onSuccess: cb }
//   )

export const useEventPublic = (eventId: string | null) => {
  const path = `/public-api/events/event/${eventId}`
  return useQuery<EventPublicResponse, AxiosError>(
    path,
    async () => (await api.get<EventPublicResponse>(path)).data,
    { enabled: !!eventId, retry: false }
  )
}

export const useApplyForEvent = (cb: () => void) =>
  useMutation<AxiosResponse, AxiosError, string>(
    (eventId) => api.post(`/user-api/events/event/${eventId}/apply`),
    { onSuccess: cb }
  )

export const useEventParticipants = (eventId: string | null) => {
  const path = `/user-api/events/event/${eventId}/participants`
  return useQuery<EventParticipant[], AxiosError>(
    path,
    async () => (await api.get<EventParticipant[]>(path)).data,
    { enabled: !!eventId }
  )
}

export const useEventApplicationsAdmin = (eventId: string | null) => {
  const path = `/admin-api/events/event/${eventId}/application`
  return useQuery<EventApplication[], AxiosError>(
    path,
    async () => (await api.get<EventApplication[]>(path)).data,
    { enabled: !!eventId }
  )
}

export const useEventApplication = (
  eventId: string | null,
  eventApplicationId: string | null
) => {
  const path = `/admin-api/events/event/${eventId}/application/${eventApplicationId}`
  return useQuery<EventApplication, AxiosError>(
    path,
    async () => (await api.get<EventApplication>(path)).data,
    { enabled: !!(eventId && eventApplicationId) }
  )
}

export const useUpdateEventApplication = (
  eventId: string | null,
  cb: () => void
) => {
  return useMutation<
    AxiosResponse,
    AxiosError,
    { id: string; data: Partial<EventApplication> }
  >(
    ({ id, data }) =>
      api.put(`/admin-api/events/event/${eventId}/application/${id}`, data),
    { onSuccess: cb }
  )
}

export const useApplicationStatusChange = (cb: () => void) => {
  return useMutation<
    AxiosResponse,
    AxiosError,
    { applicationId: string; status: EventApplicationStatus }
  >(
    ({ applicationId, status }) =>
      api.put(`/user-api/events/applications/${applicationId}`, { status }),
    { onSuccess: () => cb() }
  )
}

export const useDeleteEventApplication = (
  eventId: string | null,
  cb: () => void
) => {
  return useMutation<AxiosResponse, AxiosError, string>(
    (eventApplicationId) =>
      api.delete(
        `/admin-api/events/event/${eventId}/application/${eventApplicationId}`
      ),
    { onSuccess: cb }
  )
}

export const useEventForm = (eventId: string | null) => {
  const path = `/user-api/events/event/${eventId}/form`
  return useQuery<PublicForm, AxiosError>(
    path,
    async () => (await api.get<PublicForm>(path)).data,
    { retry: false, enabled: !!eventId }
  )
}

export const useEventWithForm = (formId: string | null) => {
  const path = `/user-api/events/event/with-form/${formId}`
  return useQuery<EventPreview | null, AxiosError>(
    path,
    async () => (await api.get<EventPreview | null>(path)).data,
    { retry: false, enabled: !!formId }
  )
}

export const useSubmitEventForm = (
  eventId: string | null,
  formId: string | null,
  cb: () => void
) => {
  const path = `/user-api/events/event/${eventId}/form/${formId}/apply`
  return useMutation<AxiosResponse, AxiosError, FormSubmissionRequest>(
    (data) => api.post(path, data),
    { onSuccess: cb }
  )
}

export const useToggleEventCheckmark = (eventId: string, cb: () => void) =>
  useMutation<AxiosResponse, AxiosError, EventToogleCheckboxRequest>(
    (data) =>
      api.post(`/user-api/events/event/${eventId}/checkmark`, {
        checkboxId: data.checkboxId,
        checked: data.checked,
      }),
    { onSuccess: cb }
  )

export const useGlobalEvents = (year: number, month: number) => {
  const path = '/user-api/events/global-events'
  return useQuery<GlobalEvent[], AxiosError>(
    [path, { year, month }],
    async ({ queryKey }) =>
      (await api.get<GlobalEvent[]>(path, { params: queryKey[1] })).data
  )
}

export const useMetadata = (
  opts: { enabled?: boolean } = { enabled: false }
) => {
  const path = `/user-api/events/metadata`
  return useQuery<EventMetadata, AxiosError>(
    path,
    async () => (await api.get<EventMetadata>(path)).data,
    {
      enabled: opts.enabled,
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  )
}

export const useResponsibleUsers = () => {
  const path = `/admin-api/events/responsible-users`
  return useQuery<User[], AxiosError>(
    path,
    async () => (await api.get<User[]>(path)).data
  )
}
