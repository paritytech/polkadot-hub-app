import { EntityVisibility } from '#shared/types'

export type GeneralChecklistItem = {
  id: string
  label: string
  checked?: boolean
}

export interface Checklist {
  id: string
  visibility: EntityVisibility.None | EntityVisibility.Url
  allowedRoles: string[]
  offices: string[]
  title: string
  type: string
  userIds: Array<string>
  items: GeneralChecklistItem[]
  answers?: ChecklistAnswer[]
  progress?: number
  joinedDate?: Date | null
  createdAt: Date
  updatedAt: Date
}

export type ChecklistsResponse = {
  result: Checklist[]
  totalItems: number
  totalProgress: number
  totalChecked: number
}

export type ChecklistAnswer = {
  id: string
  checklistId: string
  userId: string
  answers: GeneralChecklistItem[]
  createdAt: Date
  updatedAt: Date
}

export type ChecklistAnswerUpdate = Pick<
  ChecklistAnswer,
  'checklistId' | 'answers'
>

export type ChecklistAdminResponse = Checklist & {
  users: Array<{ id: string; email: string }>
}

export const ChecklistType: Record<string, string> = {
  all: 'all',
  selected: 'selected',
  new: 'new joiners',
}

export const ChecklistTypeLabels = [
  {
    value: ChecklistType.all,
    label: 'all users',
  },
  {
    value: ChecklistType.new,
    label: 'new joiners from a certain date',
  },
  { value: ChecklistType.selected, label: 'selected users' },
]

export type ChecklistCreateFields = Pick<
  Checklist,
  | 'title'
  | 'type'
  | 'userIds'
  | 'items'
  | 'visibility'
  | 'allowedRoles'
  | 'offices'
  | 'joinedDate'
> &
  Partial<Checklist>

export type ChecklistAnswerCreateFields = Pick<
  ChecklistAnswer,
  'userId' | 'checklistId' | 'answers'
> &
  Partial<ChecklistAnswer>
