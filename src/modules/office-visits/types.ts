import { User } from '#shared/types'

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

export type DailyEventType = {
  id: string
  value: string
  type: string
  date: string
  dateTime: string
  description: string
  areaId?: string
  objectId?: string
  user?: User
  status: string
}

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
  occupancyPercentByRole: Array<{
    role: string
    occupancyPercent: number
  }>
  guests: Array<{ fullName: string; email: string }>
}
