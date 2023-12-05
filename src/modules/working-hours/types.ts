export interface WorkingHoursEntry {
  id: string
  userId: string
  date: string
  startTime: string
  endTime: string
  createdAt: Date
  updatedAt: Date
}

export type WorkingHoursEntryCreationRequest = Pick<
  WorkingHoursEntry,
  'date' | 'startTime' | 'endTime'
>

export type WorkingHoursEntryUpdateRequest = Pick<
  WorkingHoursEntry,
  'id' | 'startTime' | 'endTime'
>

export type WorkingHoursConfig = {
  defaultEntries: [string, string][]
  personalDefaultEntries: [string, string][]
  workingDays: number[]
  canPrefillDay: boolean
  canPrefillWeek: boolean
  weeklyWorkingHours: number
  weeklyOvertimeHoursNotice: number
  weeklyOvertimeHoursWarning: number
  editablePeriod: {
    current: 'day' | 'isoWeek' | 'month'
    extraDaysAtEdges: [number, number]
  }
}

export type AdminWorkingHoursConfig = Record<string, WorkingHoursConfig>

export type DefaultWorkingHoursEntry = Pick<
  WorkingHoursEntry,
  'id' | 'userId' | 'startTime' | 'endTime' | 'createdAt' | 'updatedAt'
>

export type DefaultWorkingHoursEntryCreationRequest = Pick<
  DefaultWorkingHoursEntry,
  'startTime' | 'endTime'
>

export type DefaultWorkingHoursEntryUpdateRequest = Pick<
  DefaultWorkingHoursEntry,
  'id' | 'startTime' | 'endTime'
>

export type GenericWorkingHoursEntry = Pick<
  WorkingHoursEntry,
  'startTime' | 'endTime'
> & { [key: string]: any }

export type AdminTimeOffDate = {
  userId: string
  date: string
}

export interface WorkingHoursUserConfig {
  id: string
  userId: string
  value: {
    weeklyWorkingHours: number
  }
  createdAt: Date
  updatedAt: Date
}
