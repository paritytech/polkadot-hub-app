import {
  AuthAccount,
  CityPublic,
  CountryQueryResponse,
  GeoData,
  ImportedTagGroup,
  OnboardingProfileRequest,
  ProfileFieldsMetadata,
  ProfileRequest,
  PublicUserProfile,
  Tag,
  TagGroup,
  User,
  UserCompact,
  UserMapPin,
  UserStats,
  UserTagsRequest,
} from '#shared/types'
import { api } from '#client/utils/api'
import { AxiosError, AxiosResponse } from 'axios'
import { useMutation, useQuery } from 'react-query'

const PREVENT_RETRY_OPTIONS = {
  retry: false,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
}

export const useUsersCompact = (
  ids: string[] = [],
  { enabled, retry } = { enabled: true, retry: true }
) => {
  const path = '/user-api/users/user/batch'
  return useQuery<UserCompact[], AxiosError>(
    [path],
    async () => (await api.post<UserCompact[]>(path, ids)).data,
    {
      enabled,
      ...(retry ? {} : PREVENT_RETRY_OPTIONS),
    }
  )
}

export const useUsersAdmin = (
  ids: string[] = [],
  { enabled } = { enabled: true }
) => {
  const path = '/admin-api/users/user'
  return useQuery<User[], AxiosError>(
    [path, { ids: ids.length ? ids : undefined }],
    async ({ queryKey }) =>
      (await api.get<User[]>(path, { params: queryKey[1] })).data,
    { enabled }
  )
}

export const useMapApiKey = () => {
  const path = '/user-api/users/mapbox'
  return useQuery<string | null, AxiosError>(
    path,
    async () => (await api.get<string | null>(path)).data
  )
}

export const useUsersMap = () => {
  const path = '/user-api/users/map-pins'
  return useQuery<UserMapPin[], AxiosError>(
    path,
    async () => (await api.get<UserMapPin[]>(path)).data
  )
}

export const useMapStats = () => {
  const path = '/user-api/users/map-stats'
  return useQuery<UserStats, AxiosError>(
    path,
    async () => (await api.get<UserStats>(path)).data
  )
}

export const useUpdateUserAdmin = (cb: () => void) =>
  useMutation<void, AxiosError, Pick<User, 'id' | 'roles'>>(
    ({ id, ...data }) => api.put(`/admin-api/users/user/${id}`, data),
    { onSuccess: cb }
  )

export const useUpdateProfile = (cb: () => void) =>
  useMutation<AxiosResponse, AxiosError, ProfileRequest>(
    (data: ProfileRequest) => api.put(`/user-api/users/me`, data),
    { onSuccess: cb }
  )

type GeodataUpdateType = {
  city?: string | null
  country?: string | null
  geodata: GeoData | null
}

export const useUpdateGeodata = (cb: () => void) =>
  useMutation<AxiosResponse, AxiosError, GeodataUpdateType>(
    (data: GeodataUpdateType) => api.put(`/user-api/users/me/geo`, data),
    { onSuccess: cb }
  )

export const useSubmitOnboarding = (cb: () => void) =>
  useMutation<AxiosResponse, AxiosError, OnboardingProfileRequest>(
    (data: OnboardingProfileRequest) =>
      api.post(`/user-api/users/me/onboarding`, data),
    { onSuccess: cb }
  )

export const usePublicProfile = (userId: string | null) => {
  const path = `/user-api/users/profile/${userId}`
  return useQuery<PublicUserProfile, AxiosError>(
    path,
    async () => (await api.get<PublicUserProfile>(path)).data,
    { enabled: !!userId }
  )
}

export const useUserCompact = (
  userId: string | null,
  { enabled } = { enabled: true }
) => {
  const path = `/user-api/users/user/${userId}`
  return useQuery<UserCompact, AxiosError>(
    path,
    async () => (await api.get<UserCompact>(path)).data,
    { enabled }
  )
}

export const useCountries = () => {
  const path = '/user-api/users/countries'
  return useQuery<CountryQueryResponse, AxiosError>(
    path,
    async () => (await api.get<CountryQueryResponse>(path)).data,
    {
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  )
}

export const useCitySearchSuggestion = (
  query: string | null,
  countryCode: string | null
) => {
  const path = '/user-api/users/cities/suggestions'
  return useQuery<CityPublic[], AxiosError>(
    [path, { query, countryCode }],
    async ({ queryKey }) =>
      (await api.get<CityPublic[]>(path, { params: queryKey[1] })).data,
    { enabled: !!(query || '').trim() && !!countryCode }
  )
}

export const useTags = () => {
  const path = `/user-api/users/tags`
  return useQuery<Tag[], AxiosError>(
    path,
    async () => (await api.get<Tag[]>(path)).data,
    {
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  )
}

export const useGroupedTags = () => {
  const path = `/user-api/users/tags`
  return useQuery<TagGroup[], AxiosError>(
    path,
    async () =>
      (
        await api.get<TagGroup[]>(path, {
          params: { groupBy: 'category' },
        })
      ).data
  )
}

export const useMyTags = (opts: { retry: boolean } = { retry: true }) => {
  const path = `/user-api/users/me/tags`
  return useQuery<Tag[], AxiosError>(
    path,
    async () => (await api.get<Tag[]>(path)).data,
    opts.retry
      ? {}
      : {
          retry: false,
          refetchOnWindowFocus: false,
          refetchOnMount: false,
          refetchOnReconnect: false,
        }
  )
}

export const useUpdateUserTags = (cb: () => void) =>
  useMutation<AxiosResponse, AxiosError, UserTagsRequest>(
    (data: UserTagsRequest) => api.put(`/user-api/users/me/tags`, data),
    { onSuccess: cb }
  )

export const useImportTagsAdmin = (cb: () => void) =>
  useMutation<AxiosResponse, AxiosError, ImportedTagGroup[]>(
    (data: ImportedTagGroup[]) =>
      api.post(`/admin-api/users/tags/import`, data),
    { onSuccess: cb }
  )

export const useUpdateLinkedAccounts = (cb: () => void) =>
  useMutation<AxiosResponse, AxiosError, AuthAccount>(
    (data: AuthAccount) => api.put(`/user-api/users/settings/link`, data),
    {
      onSuccess: cb,
    }
  )

export const useUnlinkAccount = (cb: () => void) =>
  useMutation<AxiosResponse, AxiosError, AuthAccount>(
    (data: AuthAccount) => api.put(`/user-api/users/settings/unlink`, data),
    {
      onSuccess: cb,
    }
  )

export const useDeleteMyAccount = (cb: () => void) =>
  useMutation<AxiosResponse, AxiosError>(
    () => api.delete(`/user-api/users/me`),
    {
      onSuccess: cb,
    }
  )

export const useDeleteAccount = (cb: () => void) =>
  useMutation<AxiosResponse, AxiosError, { id?: string }>(
    ({ id }) => api.delete(`/admin-api/users/users/${id}`),
    {
      onSuccess: cb,
    }
  )

export const useRevertDeleteAccount = (cb: () => void) =>
  useMutation<AxiosResponse, AxiosError, { id?: string }>(
    ({ id }) => api.put(`/admin-api/users/users/${id}/revert`),
    {
      onSuccess: cb,
    }
  )

export const useMetadata = () => {
  const path = `/user-api/users/metadata`
  return useQuery<ProfileFieldsMetadata, AxiosError>(
    path,
    async () => (await api.get<ProfileFieldsMetadata>(path)).data,
    {
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  )
}
