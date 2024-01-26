import { VisitStatus, VisitType } from '#shared/types'

export const ColorsBg: Record<string, string> = {
  [VisitType.RoomReservation]: 'bg-cta-hover-jade',
  [VisitType.Visit]: 'bg-cta-hover-purple',
  [VisitType.Guest]: 'bg-cta-hover-cerullean',
}

export const ColorsBorder: Record<string, string> = {
  [VisitType.RoomReservation]: 'border-cta-jade',
  [VisitType.Visit]: 'border-cta-purple',
  [VisitType.Guest]: 'border-cta-hover-cerullean',
}

export const ColorsHover: Record<string, string> = {
  [VisitType.RoomReservation]: `hover:${
    ColorsBorder[VisitType.RoomReservation]
  }`,
  [VisitType.Visit]: `hover:${ColorsBorder[VisitType.Visit]}`,
  [VisitType.Guest]: `hover:${ColorsBorder[VisitType.Guest]}`,
}

export const OfficeVisitsHeaders = {
  [VisitType.Visit]: 'Desks',
  [VisitType.Guest]: 'Guest Visits',
  [VisitType.RoomReservation]: 'Rooms',
} as const

export const StatusColor: Record<VisitStatus, string> = {
  confirmed: 'bg-green-500',
  pending: 'bg-yellow-500',
  cancelled: 'bg-red-500',
}
