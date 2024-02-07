import { AxiosError, AxiosResponse } from 'axios'
import { useMutation, useQuery } from 'react-query'
import { api } from '#client/utils/api'
import {
  OfficeRoom,
  RoomDisplayData,
  RoomReservation,
  RoomReservationRequest,
  RoomReservationStatus,
  RoomReservationUpdateRequest,
} from '#shared/types'

export const usePlaceholderMessages = (officeId: string | undefined) => {
  const path = '/user-api/room-reservation/placeholder-messages'
  return useQuery<string, AxiosError>(
    [path, { office: officeId }],
    async ({ queryKey }) =>
      (await api.get<string>(path, { params: queryKey[1] })).data
  )
}

export const useRooms = (
  officeId: string | undefined,
  allRooms: boolean = false
) => {
  const path = '/user-api/room-reservation/room'
  return useQuery<OfficeRoom[], AxiosError>(
    [path, { office: officeId, allRooms: allRooms || undefined }],
    async ({ queryKey }) =>
      (await api.get<OfficeRoom[]>(path, { params: queryKey[1] })).data
  )
}

export const useAvailableRoomsForTimeSlot = (
  slot: string,
  officeId: string,
  date: string
) => {
  const path = '/user-api/room-reservation/time-slots/rooms'
  return useQuery<OfficeRoom[], AxiosError>(
    [path, { office: officeId, slot, date }],
    async ({ queryKey }) =>
      (await api.get<OfficeRoom[]>(path, { params: queryKey[1] })).data,
    { enabled: !!slot }
  )
}

export const useAvailableTimeSlotsForRoom = (
  officeId: string,
  roomId: string,
  duration: number,
  date: string
) => {
  const path = `/user-api/room-reservation/rooms/${roomId}/time-slots`
  return useQuery<string[], AxiosError>(
    [path, { office: officeId, duration, date }],
    async ({ queryKey }) =>
      (await api.get<string[]>(path, { params: queryKey[1] })).data,
    { enabled: !!roomId, keepPreviousData: true }
  )
}

export const useAvailableTimeRanges = (
  officeId: string | undefined,
  duration: number,
  date: string
) => {
  const path = '/user-api/room-reservation/time-slots'
  return useQuery<string[], AxiosError>(
    [path, { office: officeId, duration, date }],
    async ({ queryKey }) =>
      (await api.get<string[]>(path, { params: queryKey[1] })).data
  )
}

export const useRoomOccupancy = (
  officeId: string,
  roomId: string,
  date: string
) => {
  const path = `/user-api/room-reservation/room/${roomId}/occupancy`
  return useQuery<string[][], AxiosError>(
    [path, { office: officeId, date }],
    async ({ queryKey }) =>
      (await api.get<string[][]>(path, { params: queryKey[1] })).data,
    { enabled: !!roomId && !!date, keepPreviousData: true }
  )
}

export const useCreateRoomReservation = (officeId: string, cb: () => void) =>
  useMutation<AxiosResponse, AxiosError, RoomReservationRequest>(
    (data: RoomReservationRequest) =>
      api.post(
        `/user-api/room-reservation/room-reservations?office=${encodeURIComponent(
          officeId
        )}`,
        data
      ),
    { onSuccess: cb }
  )

export const useCreateRoomReservationTablet = (
  officeId: string,
  cb: () => void
) =>
  useMutation<AxiosResponse, AxiosError, RoomReservationRequest>(
    (data: RoomReservationRequest) =>
      api.post(
        `/public-api/room-reservation/room-reservations?office=${encodeURIComponent(
          officeId
        )}`,
        data
      ),
    { onSuccess: cb }
  )

export const useMyRoomReservations = (officeId: string) => {
  const path = '/user-api/room-reservation/room-reservation'
  return useQuery<RoomReservation[], AxiosError>(
    [path, { office: officeId }],
    async ({ queryKey }) =>
      (await api.get<RoomReservation[]>(path, { params: queryKey[1] })).data
  )
}

export const useRoomReservation = (officeId: string, reservationId: string) => {
  const path = `/user-api/room-reservation/room-reservation/${reservationId}`
  return useQuery<
    RoomReservation & { roomDetail: OfficeRoom; officeName: string },
    AxiosError
  >(
    [path, { office: officeId }],
    async ({ queryKey }) =>
      (
        await api.get<
          RoomReservation & { roomDetail: OfficeRoom; officeName: string }
        >(path, {
          params: queryKey[1],
        })
      ).data
  )
}

export const useRoomDisplayPolling = () => {
  const path = `/public-api/room-reservation/room/display`
  return useQuery<RoomDisplayData | null, AxiosError>(
    path,
    async () => (await api.get<RoomDisplayData | null>(path)).data,
    {
      refetchOnWindowFocus: false,
      refetchInterval: 8e3,
      cacheTime: 0,
      staleTime: 0,
    }
  )
}

export const useUpdateRoomDisplayDevice = (
  deviceId: string | null,
  cb: () => void
) =>
  useMutation<AxiosResponse, AxiosError, { roomId: string }>(
    (data: { roomId: string }) =>
      api.put(`/admin-api/room-reservation/device/${deviceId}`, data),
    { onSuccess: cb }
  )

export const useUpdateReservationDuration = (cb: () => void) => {
  return useMutation<AxiosResponse, AxiosError, { reservationId: string }>(
    ({ reservationId }) =>
      api.put<any>(`/public-api/room-reservation/${reservationId}/duration`),
    { onSuccess: cb }
  )
}

export const useRoomReservationsAdmin = (officeId: string) => {
  const path = '/admin-api/room-reservation/room-reservation'
  return useQuery<RoomReservation[], AxiosError>(
    [path, { office: officeId }],
    async ({ queryKey }) =>
      (await api.get<RoomReservation[]>(path, { params: queryKey[1] })).data
  )
}

export const useUpdateRoomReservation = (cb: () => void) =>
  useMutation<
    AxiosResponse,
    AxiosError,
    { id: string; data: RoomReservationUpdateRequest }
  >(
    (request: { id: string; data: RoomReservationUpdateRequest }) =>
      api.put(
        `/admin-api/room-reservation/room-reservation/${request.id}`,
        request.data
      ),
    { onSuccess: cb }
  )

export const useUpdateRoomReservationByUser = (cb: () => void) => {
  return useMutation<
    AxiosResponse,
    AxiosError,
    { id: string; status: RoomReservationStatus }
  >(
    ({ id, status }) =>
      api.put<any>(`/user-api/room-reservation/${id}`, { status }),
    { onSuccess: cb }
  )
}
