import config from '#server/config'
import { User } from '#modules/users/server/models'
import { Form, FormSubmission } from '#shared/types'

export const getAllFormSubmissionsUrl = (formId: string) =>
  `${config.appHost}/admin/forms/${formId}/submissions`

export const getFormUrl = (formId: string) =>
  `${config.appHost}/admin/forms/${formId}`

export const getUserFormSubmissionUrl = (
  formId: string,
  submissionId: string
) => `${config.appHost}/admin/forms/${formId}/submissions/${submissionId}`

export const getTemplateData = (
  user: User | null,
  form: Form,
  formSubmission: FormSubmission,
  changes?: string | string[]
) => ({
  user: user?.usePublicProfileView(),
  form: { title: form.title, url: getFormUrl(form.id) },
  changes,
  formSubmissionsUrl: getAllFormSubmissionsUrl(form.id),
  userFormSubmissionUrl: getUserFormSubmissionUrl(form.id, formSubmission.id),
})
