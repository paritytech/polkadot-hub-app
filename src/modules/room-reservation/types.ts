export type RoomReservationStatus = 'pending' | 'confirmed' | 'cancelled'

export type RoomReservation = {
  id: string
  creatorUserId: string | null
  userIds: string[]
  status: RoomReservationStatus
  office: string
  roomId: string
  startDate: Date
  endDate: Date
  createdAt: Date
  updatedAt: Date
}

export type RoomReservationRequest = {
  userIds: string[]
  roomId: string
  date: string
  timeSlot: string
}
export type RoomReservationUpdateRequest = Pick<RoomReservation, 'status'>

export type RoomDisplayDevice = {
  id: string
  confirmedAt: Date
  confirmedByUserId: string
  office: string
  roomId: string
  createdAt: Date
  updatedAt: Date
}

export type RoomDisplayData = {
  deviceId: string
  confirmed: boolean
  roomId: string | null
  roomName: string | null
  workingHours: Array<string> | null
  office: string | null
  timezone: string | null
  current: RoomReservation | null
  upcoming: RoomReservation[]
  usersById: Record<string, { fullName: string; avatar: string }>
}

// TODO: make it enum
export const RoomBookingModes: Record<string, string> = {
  AnyRoom: 'Any Room Available',
  SpecificRoom: 'Specific Room',
}

// TODO: move it to client helpers/components
export const RoomBookingTabHeaders = {
  [RoomBookingModes.AnyRoom]: ['Book Any Room Available', 'Any Room'],
  [RoomBookingModes.SpecificRoom]: ['Book Specific Room', 'Specific Room'],
}

export type OfficeRoomCompact = {
  id: string
  name: string
  officeId: string
}

export type RoomReservationAdminDashboardStats = {
  reservationsToday: number
  reservationsTotal: number
  anonymouseReservationsPercent: number
  bookersToday: number
  bookersTotal: number
  reservationsByDate: {
    date: string
    total: number
  }[]
  topBookers: {
    userId: string
    fullName: string
    avatar: string | null
    reservations: number
  }[]
}
