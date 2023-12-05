import { Form } from '#modules/forms/types'
import { User } from '#modules/users/types'
import { EntityVisibility } from '#shared/types'

// Event
export interface Event {
  id: string
  createdAt: Date
  updatedAt: Date
  creatorUserId: string
  title: string
  description: string | null
  visibility: EntityVisibility
  allowedRoles: string[]
  offices: string[]
  formId: string | null
  startDate: Date
  endDate: Date
  mapUrl: string | null
  address: string | null
  location: string | null
  locationLat: number | null
  locationLng: number | null
  coverImageUrl: string | null
  content: string | null
  checklist: EventCheckbox[]
  confirmationRule: EventConfirmationRule
  externalIds: EventExternalIds
  notificationRule: EventNotificationRule
  metadata: Record<string, any>
  responsibleUserIds: string[]
}

export type EventMetadata = {
  links?: Record<string, any>
  typeColorMap?: Record<string, any>
  officesWithGlobalEvents?: string[]
}

export type EventCheckbox = {
  id: string
  text: string
}

export type EventConfirmationRule = 'none' | 'auto_confirm'

export type EventNotificationRule = 'none' | 'on_visit_date'

export type EventExternalIds = {
  matrixRoom: string | null
}

export interface EventAdminResponse extends Event {
  applicationsCount: number
}

export interface EventPublicResponse extends Event {
  checklist: Array<EventCheckbox & { checked: boolean }>
  applicationStatus: EventApplicationStatus | null
  form: Pick<Form, 'duplicationRule' | 'visibility'> | null
  applicationId: string | null
  metadata: Record<string, any>
}

// EventApplication
export interface EventApplication {
  id: string
  createdAt: Date
  updatedAt: Date
  status: EventApplicationStatus
  eventId: string
  userId: string
  creatorUserId: string
  formId: string | null
  formSubmissionId: string | null
}

export enum EventApplicationStatus {
  Opened = 'opened',
  Pending = 'pending',
  Confirmed = 'confirmed',
  CancelledUser = 'cancelled_user',
  CancelledAdmin = 'cancelled_admin',
}

// EventCheckmark
export interface EventCheckmark {
  id: string
  createdAt: Date
  eventId: string
  userId: string
  checkboxId: string
}

// Extra
export type EventCreationRequest = Omit<
  Event,
  'id' | 'createdAt' | 'updatedAt' | 'creatorUserId' | 'externalIds'
>

export type EventToogleCheckboxRequest = {
  checkboxId: EventCheckbox['id']
  checked: boolean
}

export type EventChecklistReminderJob = {
  id: string
  userId: string
  eventId: string
  failed: boolean
  metadata: any
  createdAt: Date
}

export interface GlobalEvent {
  id: string
  title: string
  type: string
  startDate: Date
  endDate: Date
  location: string | null
  eventUrl: string
  createdAt: Date
  updatedAt: Date
}

export type EventParticipant = Pick<User, 'id' | 'fullName' | 'avatar' | 'team'>

export type EventPreview = Pick<Event, 'id' | 'title' | 'formId'>
