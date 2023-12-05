export enum VisitType {
  Visit = 'visit',
  RoomReservation = 'room-reservation',
  Guest = 'guest-invite',
}

export const OfficeVisitsHeaders = {
  [VisitType.Visit]: '',
  [VisitType.Guest]: 'Guest Visit',
  [VisitType.RoomReservation]: 'Meeting Room Bookings',
} as const

export type GenericVisit = {
  id: string
  value: string
  type: VisitType
  dateTime?: string
  deskName?: string
  areaName?: string
  description?: string
  mainType?: boolean
}

export type VisitsDailyStats = {
  date: string
  maxCapacity: number
  existingVisitsNumber: number
  occupancyPercent: number
  occupancyPercentByDepartment: Array<{
    department: string
    occupancyPercent: number
  }>
  guests: Array<{ fullName: string; email: string }>
}
