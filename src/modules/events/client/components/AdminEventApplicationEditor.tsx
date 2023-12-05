import * as React from 'react'
import { useStore } from '@nanostores/react'
import dayjs from 'dayjs'
import {
  Button,
  H1,
  Table,
  Link,
  Input,
  Avatar,
  Tag,
  Breadcrumbs,
  LoaderSpinner,
  ButtonsWrapper,
} from '#client/components/ui'
import { showNotification } from '#client/components/ui/Notifications'
import {
  FormQuestion,
  FormStep,
  FormBlock,
  FormSubmissionAnswer,
  FormSubmissionMetadataRecord,
  EventApplicationStatus,
} from '#shared/types'
import {
  useEvent,
  useEventApplication,
  useUpdateEventApplication,
} from '../queries'
import {
  useForm,
  useFormSubmission,
  useUpdateFormSubmission,
} from '#modules/forms/client/queries'
import { useUsersCompact } from '#modules/users/client/queries'
import * as stores from '#client/stores'
import { by } from '#shared/utils/fp'
import { useDocumentTitle } from '#client/utils/hooks'
import { statusLabel } from '../helpers'

const statuses: EventApplicationStatus[] = [
  EventApplicationStatus.Opened,
  EventApplicationStatus.Confirmed,
  EventApplicationStatus.CancelledUser,
  EventApplicationStatus.CancelledAdmin,
]

export const AdminEventApplicationEditor = () => {
  const page = useStore(stores.router)
  const { eventId, eventApplicationId } =
    page?.route === 'adminEventApplication'
      ? page.params
      : { eventId: null, eventApplicationId: null }

  const { data: event } = useEvent(eventId)
  const { data: application, refetch: refetchApplication } =
    useEventApplication(eventId, eventApplicationId)
  const { data: form, refetch: refetchForm } = useForm(event?.formId || null)
  const { data: formSubmission } = useFormSubmission(
    event?.formId || null,
    application?.formSubmissionId || null
  )
  const { data: users = [] } = useUsersCompact(
    application ? [application.creatorUserId] : [],
    { enabled: !!application, retry: false }
  )

  const user = React.useMemo(() => users[0] || null, [users])
  useDocumentTitle(
    user && event
      ? `${user.fullName}'s application on ${event.title}`
      : 'Loading...'
  )
  const metadataFields = React.useMemo(() => form?.metadataFields || [], [form])
  const questions = React.useMemo(() => {
    const result: FormQuestion[] = []
    if (!form) return []
    ;(form?.content || []).forEach((step: FormStep) => {
      ;(step.blocks || []).forEach((block: FormBlock) => {
        if (block.type === 'input') {
          result.push({
            id: block.id,
            question: block.title || '-',
            label: block.label || block.id,
          })
        }
      })
    })
    return result
  }, [form])

  const [data, setData] = React.useState<Record<string, string | string[]>>({})
  const [formIsPristine, setFormIsPristine] = React.useState(true)
  const onChangeData = React.useCallback(
    (field: string) => (value: string | boolean) => {
      setData((x) => ({ ...x, [field]: String(value) }))
      setFormIsPristine(false)
    },
    []
  )
  React.useEffect(() => {
    const result: Record<string, string | string[]> = {}
    if (!questions?.length || !formSubmission) {
      return
    }
    const metadataById = (formSubmission.metadata || []).reduce<
      Record<string, FormSubmissionMetadataRecord>
    >(by('id'), {})
    metadataFields.map((m) => {
      const metadataRecord = metadataById[m.id]
      if (metadataRecord) {
        result[m.id] = metadataRecord.value
      }
    })
    const answersById = (formSubmission.answers || []).reduce<
      Record<string, FormSubmissionAnswer>
    >(by('id'), {})
    questions.forEach((q) => {
      const answer = answersById[q.id]
      if (answer) {
        result[q.id] = answer.value
      }
    })
    setData(result)
  }, [questions, formSubmission, metadataFields])

  const { mutate: updateEventApplication } = useUpdateEventApplication(
    event?.id || null,
    () => {
      refetchApplication()
      showNotification(
        "The event application's status successfully changed",
        'success'
      )
    }
  )
  const updateStatus = React.useCallback(
    (status: EventApplicationStatus) => {
      if (application) {
        updateEventApplication({ id: application.id, data: { status } })
      }
    },
    [updateEventApplication, application]
  )
  const onChangeStatus = React.useCallback(
    (status: EventApplicationStatus) => () => {
      if (!application) return null
      if (application.status !== status) {
        updateStatus(status)
      }
    },
    [application]
  )

  const { mutate: updateFormSubmission } = useUpdateFormSubmission(
    form?.id || null,
    formSubmission?.id || null,
    () => {
      if (event) {
        stores.goTo('adminEventApplications', { eventId: event.id })
      }
      showNotification('The event application has been modified', 'success')
      setFormIsPristine(true)
    }
  )

  const onSubmit = React.useCallback(
    (ev: React.FormEvent) => {
      ev.preventDefault()
      const answers: FormSubmissionAnswer[] = questions.map((q) => ({
        id: q.id,
        question: q.question,
        value: data[q.id],
      }))
      const metadata: FormSubmissionMetadataRecord[] = metadataFields.map(
        (m) => ({
          id: m.id,
          label: m.label,
          value: String(data[m.id] || ''),
        })
      )
      updateFormSubmission({
        answers,
        metadata,
      })
    },
    [data, questions, metadataFields]
  )

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Events', href: '/admin/events' },
          {
            label: event?.title || 'Loading...',
            href: `/admin/events/${event?.id}`,
          },
          {
            label: 'Applications',
            href: `/admin/events/${event?.id}/applications`,
          },
          { label: user ? `${user.fullName}'s application` : 'Loading...' },
        ]}
      />
      {!event || !application || !user ? (
        <LoaderSpinner className="min-h-[200px]" />
      ) : (
        <>
          <H1>
            {user.fullName}'s "{event.title}" event application
          </H1>
          <div className="my-4 flex items-center">
            <b>User:</b>
            <span className="inline-flex items-center ml-2">
              <Avatar src={user.avatar} userId={user.id} size="small" />
              <Link href={`/profile/${user.id}`} className="ml-2">
                {user.fullName}
              </Link>
            </span>
          </div>

          <div className="my-4">
            <b>Date:</b>
            <span className="ml-2">
              {dayjs(application.createdAt).format('MMMM D YYYY, HH:mm')}
            </span>
          </div>

          <div className="mt-4 mb-2">
            <b>Status:</b>
            <span className="ml-2">
              {statuses.map((status) => (
                <Button
                  key={status}
                  size="small"
                  onClick={onChangeStatus(status)}
                  className="ml-2 mb-2"
                  kind={status !== application.status ? 'secondary' : 'primary'}
                >
                  {statusLabel[status]}
                </Button>
              ))}
            </span>
          </div>

          {!!form && (
            <form onSubmit={onSubmit}>
              {!!metadataFields.length && (
                <div className="my-8">
                  <div className="mb-4 font-bold">Metadata:</div>
                  {metadataFields.map((m) => (
                    <Input
                      key={m.id}
                      type="text"
                      label={m.label || m.id}
                      name={m.id}
                      value={data[m.id] || ''}
                      onChange={onChangeData(m.id)}
                      containerClassName="w-full mb-4"
                    />
                  ))}
                </div>
              )}

              <div className="my-8">
                <div className="mb-4 font-bold">Form data:</div>
                {questions.map((q) => (
                  <Input
                    key={q.id}
                    type="text"
                    name={q.id}
                    value={data[q.id] || ''}
                    onChange={onChangeData(q.id)}
                    label={q.label || q.id}
                    containerClassName="mb-4 w-full"
                  />
                ))}
              </div>

              <div className="sticky bg-white mt-6 py-4 bottom-0 border-t border-gray-200 px-8 -mx-8 -mb-8">
                <ButtonsWrapper
                  right={[
                    <Button
                      disabled={formIsPristine}
                      type="submit"
                      kind="primary"
                    >
                      Update application
                    </Button>,
                  ]}
                />
              </div>
            </form>
          )}
        </>
      )}
    </div>
  )
}
