export type VisitStatus = 'confirmed' | 'pending' | 'cancelled'

export interface Visit {
  id: string
  userId: string
  status: VisitStatus
  areaId: string
  deskId: string
  areaName: string
  deskName: string
  officeId: string
  date: string
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export type PickedVisit = Pick<
  Visit,
  'userId' | 'date' | 'officeId' | 'areaId' | 'deskId' | 'metadata' | 'status'
>

export type AreaDeskPair = {
  areaId: string
  deskId: string
}

export type VisitsDailyOccupancy = {
  date: string
  maxCapacity: number
  existingVisitsNumber: number
  occupancyPercent: number
}
export type VisitsOccupancy = VisitsDailyOccupancy[]

export type VisitRequest = {
  dates: string[]
  areaId: string
  deskId: string
}

export type VisitsCreationRequest = {
  officeId: string
  metadata: Record<string, any>
  status: VisitStatus
  visits: VisitRequest[]
}

export type OfficeVisitor = {
  userId: string
  fullName: string
  avatar: string
  areaName: string
}

export type VisitReminderJob = {
  id: string
  officeId: string
  userId: string
  visitId: string
  failed: boolean
  metadata: any
  createdAt: Date
}
