import { WorkingHoursRoleConfig as _WorkingHoursRoleConfig } from './metadata-schema'

export interface WorkingHoursEntry {
  id: string
  userId: string
  date: string
  startTime: string
  endTime: string
  metadata: Record<string, unknown>
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

export type WorkingHoursConfig = _WorkingHoursRoleConfig & {
  personalDefaultEntries: [string, string][]
}

export type WorkingHoursRoleConfig = _WorkingHoursRoleConfig

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
    workingDays: number[]
  }
  createdAt: Date
  updatedAt: Date
}
