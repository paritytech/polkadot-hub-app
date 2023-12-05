import { EntityVisibility } from '#shared/types'

// Form
export interface Form {
  id: string
  visibility:
    | EntityVisibility.None
    | EntityVisibility.Url
    | EntityVisibility.UrlPublic
  allowedRoles: string[]
  duplicationRule: FormDuplicationRule
  title: string
  description: string | null
  content: FormContent
  metadataFields: FormMetadataField[]
  creatorUserId: string
  responsibleUserIds: string[]

  createdAt: Date
  updatedAt: Date
}

export enum FormDuplicationRule {
  Write = 'write',
  Rewrite = 'rewrite',
  RewriteEdit = 'rewrite_edit',
  Reject = 'reject',
}

export type FormMetadataField = {
  id: string
  label: string
}

export type FormContent = FormStep[]
export type FormStep = {
  id: string
  blocks: FormBlock[]
  finalActions?: FormBlockSuccessAction[]
}
export type FormBlockSuccessAction = {
  id: string
  href: string
  text: string
}
export type FormBlockOption = {
  id: string
  label: string
  value: string
}
export type FormInputBlockKind =
  | 'text'
  | 'text_long'
  | 'email'
  | 'number'
  | 'date'
  | 'date_time'
  | 'phone'
  | 'select'
  | 'checkbox'
  | 'radio'

export type FormBlock = {
  id: string
  type: 'input' | 'content'
  kind?: FormInputBlockKind
  placeholder?: string | null
  title?: string
  text?: string | null
  label?: string
  required?: boolean
  options?: FormBlockOption[]
  conditions?: FormBlockConditions
}

export type FormBlockConditions = {
  $and: FormBlockCondition[]
  $or: FormBlockCondition[]
}

export type FormBlockCondition = {
  id: string
  blockId: string
  operator:
    | '$eq'
    | '$ne'
    | '$in'
    | '$gt'
    | '$gte'
    | '$lt'
    | '$lte'
    | '$includes'
  value: string | string[]
}

// Form Submission
export interface FormSubmission {
  id: string
  userId: string | null
  creatorUserId: string | null
  formId: string
  answers: FormSubmissionAnswer[]
  metadata: FormSubmissionMetadataRecord[]
  createdAt: Date
  updatedAt: Date
  count?: number
}

export type FormSubmissionAnswer = {
  id: string
  question: string
  value: string | string[]
}
export type FormSubmissionMetadataRecord = {
  id: string
  label: string
  value: string
}

// Extra
export type FormCreationRequest = Pick<
  Form,
  | 'visibility'
  | 'allowedRoles'
  | 'duplicationRule'
  | 'title'
  | 'description'
  | 'content'
  | 'metadataFields'
  | 'responsibleUserIds'
>
export type FormData = Record<string, string | string[]>

export type FormSubmissionRequest = {
  data: FormData
  userId: string | null
}

export type FormQuestion = {
  id: string
  question: string
  label: string
}

export type PublicForm = Pick<
  Form,
  'id' | 'title' | 'duplicationRule' | 'content' | 'visibility'
>

export type PublicFormSubmission = Pick<FormSubmission, 'id' | 'answers'>

export interface FormAdminResponse extends Form {
  submissionsCount: number
}
