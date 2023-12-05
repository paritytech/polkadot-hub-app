import * as React from 'react'
import dayjs from 'dayjs'
import { useStore } from '@nanostores/react'
import {
  Button,
  H1,
  Table,
  Link,
  Breadcrumbs,
  UserLabel,
} from '#client/components/ui'
import { showNotification } from '#client/components/ui/Notifications'
import { useUsersCompact } from '#modules/users/client/queries'
import { prop, by } from '#shared/utils/fp'
import { useDocumentTitle } from '#client/utils/hooks'
import { renderComponent } from '#client/utils/portal'
import * as stores from '#client/stores'
import {
  Form,
  FormQuestion,
  FormSubmission,
  FormStep,
  FormBlock,
  RootComponentProps,
} from '#shared/types'
import {
  useForm,
  useFormSubmissions,
  useDeleteFormSubmission,
} from '../queries'

export const AdminFormSubmissions: React.FC<RootComponentProps> = ({
  portals,
}) => {
  const page = useStore(stores.router)
  const formId =
    page?.route === 'adminFormSubmissions' ? page.params.formId : null
  const { data: form } = useForm(formId)
  useDocumentTitle(form?.title || 'Loading...')
  const { data: formSubmissions, refetch: refetchFormSubmissions } =
    useFormSubmissions(formId)
  const userIds = React.useMemo(
    () =>
      (formSubmissions || []).map(prop('userId')).filter(Boolean) as string[],
    [formSubmissions, form]
  )
  const { data: users } = useUsersCompact(userIds, {
    enabled: !!form && !!userIds.length,
    retry: false,
  })
  const usersById = React.useMemo(
    () => (users || []).reduce(by('id'), {}),
    [users]
  )

  const questions = React.useMemo(() => {
    const result: FormQuestion[] = []
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

  const { mutate: deleteFormSubmission } = useDeleteFormSubmission(
    formId,
    () => {
      refetchFormSubmissions()
      showNotification('The submission has been deleted', 'success')
    }
  )

  const onRemove = React.useCallback(
    (id: string) => (ev: React.MouseEvent<HTMLElement>) => {
      ev.preventDefault()
      if (
        confirm(
          `Are you sure you want to permanently delete a user's form data?`
        )
      ) {
        deleteFormSubmission(id)
      }
    },
    []
  )

  const columns = React.useMemo(() => {
    const defaultColumns = [
      {
        id: '$$user',
        Header: () => 'User',
        accessor: (x: FormSubmission) => {
          if (!x.userId) {
            return <span className="text-gray-400">Anonym</span>
          }
          const user = usersById[x.userId || '']
          const author =
            x.userId !== x.creatorUserId
              ? usersById[x.creatorUserId || '']
              : null
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
        accessor: (x: FormSubmission) => {
          if (!x.userId) return null
          const user = usersById[x.userId || '']
          return user ? (
            <Link href={`mailto:${user.email}`} kind="secondary">
              {user.email}
            </Link>
          ) : null
        },
      },
      {
        id: '$$createdAt',
        Header: () => 'Date',
        accessor: (x: FormSubmission) =>
          dayjs(x.createdAt).format('D MMM YYYY, HH:mm'),
      },
    ]
    const metadataColumns = (form?.metadataFields || []).map((field) => ({
      id: `$$${field.id}`,
      Header: () => (
        <span>
          {field.label} <span className="text-blue-300">(meta)</span>
        </span>
      ),
      accessor: (x: FormSubmission) => {
        const metadataRecord = (x.metadata || []).find((r) => r.id === field.id)
        return metadataRecord?.value || ''
      },
    }))
    const questionColumns = questions.map((q) => ({
      id: q.id,
      Header: () => q.label || q.id,
      accessor: (x: FormSubmission) => {
        const value =
          x.answers.find((answer) => answer.id === q.id)?.value || null
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
    const actionsColumn = {
      id: '$$actions',
      Header: () => 'Actions',
      accessor: (x: FormSubmission) => (
        <div>
          <a
            className="mr-2 text-gray-500 hover:text-gray-700 underline"
            href={`/admin/forms/${formId}/submissions/${x.id}`}
          >
            Edit
          </a>
          <a
            className="text-gray-500 hover:text-gray-700 underline cursor-pointer"
            onClick={onRemove(x.id)}
          >
            Delete
          </a>
        </div>
      ),
    }
    return [
      actionsColumn,
      ...defaultColumns,
      ...metadataColumns,
      ...questionColumns,
    ]
  }, [form, formSubmissions, questions, usersById])

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Forms', href: '/admin/forms' },
          { label: form?.title || '–', href: `/admin/forms/${form?.id}` },
          { label: 'Submissions' },
        ]}
      />

      {form &&
        portals['admin_form_submissions_header']?.map(
          renderComponent({ form })
        )}

      <div className="flex items-center mb-5">
        <H1 className="flex-1 mb-0">"{form?.title}" form submissions</H1>
        <Button
          href={`/admin-api/forms/form/${formId}/submissions.csv`}
          rel="external"
        >
          Export CSV
        </Button>
      </div>
      {formSubmissions?.length ? (
        <div className="-mx-8">
          <Table columns={columns} data={formSubmissions} />
        </div>
      ) : (
        <div className="text-gray-400 text-center my-12">No data</div>
      )}
    </div>
  )
}
