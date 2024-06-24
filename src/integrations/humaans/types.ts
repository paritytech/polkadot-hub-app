type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export type Person = {
  id: string
  email: string
  firstName: string
  lastName: string
  teams: { name: string }[]
  workingDays: { day: DayOfWeek }[]
  status: 'active' | 'offboarded' | 'newHire'
}

type DayPeriod = 'full' | 'am' | 'pm'

export type TimeAwayRequestStatus = 'pending' | 'approved' | 'declined'

export type TimeAway = {
  id: string
  personId: string
  startDate: string
  startPeriod: DayPeriod
  endDate: string
  endPeriod: DayPeriod
  isTimeOff: boolean
  breakdown: {
    date: string
    period: DayPeriod
    weekend?: boolean
    holiday?: boolean
  }[]
  days: number
  requestStatus: TimeAwayRequestStatus
  workingDays: { day: DayOfWeek }[]
  timeAwayTypeId: string
  createdAt: Date
  updatedAt: Date
}

export type Paginated<T> = {
  data: T[]
  total: number
  limit: number
  skip: number
}

export type PublicHolidayCalendar = {
  id: string
  name: string
  countryCode: string
}

export type PublicHoliday = {
  id: string
  date: string
  name: string
  publicHolidayCalendarId: string
}

export type JobRole = {
  id: string
  personId: string
  jobTitle: string
  department: string
  effectiveDate: string
  endDate: string
}

export type CustomValue = {
  id: string
  value: string
  personId: string
  customFieldId: string
}
