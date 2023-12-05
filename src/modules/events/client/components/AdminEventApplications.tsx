import * as React from 'react'
import { useStore } from '@nanostores/react'
import dayjs from 'dayjs'
import {
  Button,
  H1,
  Table,
  Link,
  Breadcrumbs,
  UserLabel,
} from '#client/components/ui'
import { showNotification } from '#client/components/ui/Notifications'
import {
  FormQuestion,
  FormStep,
  FormBlock,
  EventApplication,
  FormSubmissionAnswer,
  FormSubmissionMetadataRecord,
} from '#shared/types'
import {
  useEvent,
  useEventApplicationsAdmin,
  useDeleteEventApplication,
} from '../queries'
import { useForm, useFormSubmissions } from '#modules/forms/client/queries'
import { useUsersCompact } from '#modules/users/client/queries'
import { prop, by } from '#shared/utils/fp'
import * as stores from '#client/stores'
import { useDocumentTitle } from '#client/utils/hooks'
import { getStatusBadge } from '../helpers'

type EnhancedEventApplication = EventApplication & {
  formSubmissionAnswers: FormSubmissionAnswer[] | null
  formSubmissionMetadata: FormSubmissionMetadataRecord[] | null
}

export const AdminEventApplications = () => {
  const page = useStore(stores.router)
  const eventId =
    page?.route === 'adminEventApplications' ? page.params.eventId : null

  const { data: event } = useEvent(eventId)
  useDocumentTitle(event?.title || 'Loading...')
  const { data: applications, refetch: refetchApplications } =
    useEventApplicationsAdmin(eventId)
  const { data: form, refetch } = useForm(event?.formId || null)
  const { data: formSubmissions } = useFormSubmissions(event?.formId || null)

  const userIds = React.useMemo(
    () => (applications || []).map(prop('userId')),
    [applications]
  )
  const { data: users } = useUsersCompact(userIds, {
    enabled: !!userIds.length,
    retry: false,
  })

  const usersById = React.useMemo(
    () => (users || []).reduce(by('id'), {}),
    [users]
  )
  const formSubmissionsById = React.useMemo(
    () => (formSubmissions || []).reduce(by('id'), {}),
    [formSubmissions]
  )

  const enhancedApplications: EnhancedEventApplication[] = React.useMemo(() => {
    if (!applications) return []
    return applications.map((ea) => {
      const fs = ea.formSubmissionId
        ? formSubmissionsById[ea.formSubmissionId]
        : null
      return {
        ...ea,
        formSubmissionAnswers: fs ? fs.answers : null,
        formSubmissionMetadata: fs ? fs.metadata : null,
      }
    })
  }, [applications, formSubmissionsById])

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

  const { mutate: deleteEventApplication } = useDeleteEventApplication(
    event?.id || null,
    () => {
      refetchApplications()
      showNotification('The application has been deleted', 'success')
    }
  )

  const onRemove = React.useCallback(
    (id: string) => (ev: React.MouseEvent<HTMLElement>) => {
      ev.preventDefault()
      if (
        confirm(
          `Are you sure you want to permanently delete a user's application?`
        )
      ) {
        deleteEventApplication(id)
      }
    },
    []
  )

  const columns = React.useMemo(() => {
    const defaultColumns = [
      {
        id: '$$status',
        Header: () => 'Status',
        accessor: (x: EnhancedEventApplication) => getStatusBadge(x.status),
      },
      {
        id: '$$user',
        Header: () => 'User',
        accessor: (x: EnhancedEventApplication) => {
          const user = usersById[x.userId]
          const author =
            x.userId !== x.creatorUserId ? usersById[x.creatorUserId] : null
          return (
            <span className="flex items-center">
              <UserLabel user={user} />
              {author && (
                <span className="ml-2 text-gray-400 select-none">
                  Added by {author.fullName}
                </span>
              )}
            </span>
          )
        },
      },
      {
        id: '$$email',
        Header: () => 'Email',
        accessor: (x: EnhancedEventApplication) => {
          const user = usersById[x.userId]
          return user ? (
            <Link href={`mailto:${user.email}`} kind="secondary">
              {user.email}
            </Link>
          ) : null
        },
      },
      {
        id: '$$created_at',
        Header: 'Created at',
        accessor: (x: EnhancedEventApplication) =>
          x.createdAt ? dayjs(x.createdAt).format('MMM D YYYY, HH:mm') : '–',
      },
    ]
    const metadataColumns = (form?.metadataFields || []).map((field) => ({
      id: `$$${field.id}`,
      Header: () => (
        <span>
          {field.label} <span className="text-blue-300">(meta)</span>
        </span>
      ),
      accessor: (x: EnhancedEventApplication) => {
        const metadataRecord = (x.formSubmissionMetadata || []).find(
          (r) => r.id === field.id
        )
        return metadataRecord?.value || ''
      },
    }))
    const questionColumns = questions.map((q) => ({
      id: q.id,
      Header: () => q.label || q.id,
      accessor: (x: EnhancedEventApplication) => {
        const answers = x.formSubmissionAnswers
        if (!answers) return <span className="text-gray-200">No data</span>
        const value =
          answers.find((answer) => answer.id === q.id)?.value || null
        // return Array.isArray(value) ? value.join(', ') : value
        if (Array.isArray(value)) {
          return (
            <>
              {value.map((x) => (
                <div key={x}>{x}</div>
              ))}
            </>
          )
        }
        return value
      },
    }))
    const actionColumn = {
      id: '$$actions',
      Header: () => 'Actions',
      accessor: (x: EnhancedEventApplication) => (
        <div>
          <Link
            className="mr-2"
            kind="secondary"
            href={`/admin/events/${eventId}/applications/${x.id}`}
          >
            Edit
          </Link>
          <Link kind="secondary" onClick={onRemove(x.id)}>
            Delete
          </Link>
        </div>
      ),
    }
    return [
      actionColumn,
      ...defaultColumns,
      ...metadataColumns,
      ...questionColumns,
    ]
  }, [questions, enhancedApplications, usersById, formSubmissionsById, form])

  if (!event) {
    return null
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Events', href: '/admin/events' },
          { label: event?.title || '–', href: `/admin/events/${event?.id}` },
          { label: 'Applications' },
        ]}
      />
      <div className="flex items-center mb-5">
        <H1 className="flex-1 mb-0">"{event?.title}" event applications</H1>
        {!!event.formId && (
          <Button
            href={`/admin-api/events/event/${event.id}/applications.csv`}
            rel="external"
          >
            Export CSV
          </Button>
        )}
      </div>
      {applications?.length ? (
        <div className="-mx-8">
          <Table columns={columns} data={enhancedApplications} />
        </div>
      ) : (
        <div className="text-gray-400 text-center my-12">No data</div>
      )}
    </div>
  )
}
