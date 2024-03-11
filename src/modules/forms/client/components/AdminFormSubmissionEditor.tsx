import * as React from 'react'
import dayjs from 'dayjs'
import {
  Button,
  H1,
  Link,
  Input,
  Avatar,
  Breadcrumbs,
  LoaderSpinner,
  ButtonsWrapper,
  WidgetWrapper,
} from '#client/components/ui'
import { showNotification } from '#client/components/ui/Notifications'
import {
  FormQuestion,
  FormStep,
  FormBlock,
  FormSubmissionAnswer,
  FormSubmissionMetadataRecord,
} from '#shared/types'
import { by, propEq } from '#shared/utils/fp'
import { useStore } from '@nanostores/react'
import * as stores from '#client/stores'
import { useUsersCompact } from '#modules/users/client/queries'
import { useForm, useFormSubmission, useUpdateFormSubmission } from '../queries'

export const AdminFormSubmissionEditor = () => {
  const page = useStore(stores.router)
  const { formId, formSubmissionId } =
    page?.route === 'adminFormSubmission'
      ? page.params
      : { formId: null, formSubmissionId: null }
  const { data: form } = useForm(formId)
  const { data: submission } = useFormSubmission(formId, formSubmissionId)
  const userIds = React.useMemo<string[]>(() => {
    if (!submission) return []
    return [submission.creatorUserId!, submission.userId!].filter(Boolean)
  }, [submission])
  const { data: users = [] } = useUsersCompact(userIds, {
    enabled: !!userIds.length,
    retry: false,
  })
  const user = React.useMemo(() => {
    return (
      (submission?.userId && users.find(propEq('id', submission.userId))) ||
      null
    )
  }, [users, submission])
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
    // FIXME: React Warning: A component is changing an uncontrolled input to be controlled.
    const result: Record<string, string | string[]> = {}
    if (!questions?.length || !submission) {
      return
    }
    const metadataById = (submission.metadata || []).reduce<
      Record<string, FormSubmissionMetadataRecord>
    >(by('id'), {})
    metadataFields.map((m) => {
      const metadataRecord = metadataById[m.id]
      if (metadataRecord) {
        result[m.id] = metadataRecord.value
      }
    })
    const answersById = (submission.answers || []).reduce<
      Record<string, FormSubmissionAnswer>
    >(by('id'), {})
    questions.forEach((q) => {
      const answer = answersById[q.id]
      if (answer) {
        result[q.id] = answer.value
      }
    })
    setData(result)
  }, [questions, submission, metadataFields])

  const { mutate: updateFormSubmission } = useUpdateFormSubmission(
    form?.id || null,
    submission?.id || null,
    () => {
      if (formId) {
        stores.goTo('adminFormSubmissions', { formId })
      }
      showNotification('The form submission has been modified', 'success')
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
    <WidgetWrapper>
      <Breadcrumbs
        items={[
          { label: 'Forms', href: '/admin/forms' },
          {
            label: form?.title || 'Loading...',
            href: `/admin/forms/${form?.id}`,
          },
          {
            label: 'Submissions',
            href: `/admin/forms/${form?.id}/submissions`,
          },
          {
            label: user ? `${user.fullName}'s submission` : 'Anonymous',
          },
        ]}
      />
      {!form || !submission ? (
        <LoaderSpinner />
      ) : (
        <>
          <H1>
            {user
              ? `${user.fullName}'s "${form.title}" form submission`
              : 'Anonymous form submission'}
          </H1>

          {!!user && (
            <div className="my-4 flex items-center">
              <b>User:</b>
              <span className="inline-flex items-center ml-2">
                <Avatar src={user.avatar} userId={user.id} size="small" />
                <Link href={`/profile/${user.id}`} className="ml-2">
                  {user.fullName}
                </Link>
              </span>
            </div>
          )}

          <div className="my-4">
            <b>Date:</b>
            <span className="ml-2">
              {dayjs(submission.createdAt).format('D MMM YYYY, HH:mm')}
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

              <div className="sticky bg-white mt-6 py-4 bottom-0 border-t border-gray-200 px-6 -mx-6 -mb-6 rounded-b-sm">
                <ButtonsWrapper
                  right={[
                    <Button
                      disabled={formIsPristine}
                      type="submit"
                      kind="primary"
                    >
                      Update submission
                    </Button>,
                  ]}
                />
              </div>
            </form>
          )}
        </>
      )}
    </WidgetWrapper>
  )
}
