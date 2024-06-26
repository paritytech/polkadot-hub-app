import { User } from '#shared/types'

export type ScheduledItemType = {
  id: string
  value: string
  type: string
  date: string
  extraInformation?: string
  description: string
  areaId?: string
  objectId?: string
  user?: User
  status: string
}
