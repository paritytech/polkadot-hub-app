import { EntityVisibility } from '#shared/types'

export interface AnnouncementItem {
  id: string
  title: string
  content: string
  creatorUserId: string
  offices: string[]
  allowedRoles: string[]
  visibility: EntityVisibility
  scheduledAt: Date | null
  expiresAt: Date | null
  createdAt: Date
  updatedAt: Date
}
export type AnnouncementItemRequest = Pick<
  AnnouncementItem,
  | 'title'
  | 'content'
  | 'offices'
  | 'visibility'
  | 'allowedRoles'
  | 'expiresAt'
  | 'scheduledAt'
>

export type AnnouncementItemResponse = Pick<
  AnnouncementItem,
  'title' | 'content' | 'expiresAt' | 'scheduledAt'
>
