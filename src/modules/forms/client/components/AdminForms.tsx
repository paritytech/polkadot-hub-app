import * as React from 'react'
import { useStore } from '@nanostores/react'
import {
  EntityVisibilityTag,
  ENTITY_VISIBILITY_LABEL,
} from '#client/components/EntityVisibilityTag'
import {
  Button,
  H1,
  Link,
  Table,
  Tag,
  UserLabel,
  Filters,
  LabelWrapper,
} from '#client/components/ui'
import { showNotification } from '#client/components/ui/Notifications'
import { USER_ROLE_BY_ID } from '#client/constants'
import Permissions from '#shared/permissions'
import * as stores from '#client/stores'
import { FormAdminResponse, EntityVisibility } from '#shared/types'
import { trimString } from '#client/utils'
import { by, prop } from '#shared/utils/fp'
import { useDocumentTitle } from '#client/utils/hooks'
import { useUsersCompact } from '#modules/users/client/queries'
import { useDeleteForm, useDuplicateForm, useForms } from '../queries'

export const AdminForms = () => {
  useDocumentTitle('Forms')
  const permissions = useStore(stores.permissions)
  const [visibilityFilter, setVisibilityFilter] =
    React.useState<EntityVisibility | null>(null)
  const { data: forms, refetch: refetchForms } = useForms(visibilityFilter)
  const userIds = React.useMemo(
    () => (forms || []).map(prop('creatorUserId')),
    [forms]
  )
  const { data: users } = useUsersCompact(userIds, {
    enabled: !!userIds.length,
    retry: true,
  })
  const usersById = React.useMemo(
    () => (users || []).reduce(by('id'), {}),
    [users]
  )

  const { mutate: deleteForm } = useDeleteForm(() => {
    refetchForms()
    showNotification('The form has been deleted', 'success')
  })
  const { mutate: duplicateForm } = useDuplicateForm(() => {
    refetchForms()
    showNotification('The form has been duplicated', 'success')
  })

  const onRemove = React.useCallback(
    (form: FormAdminResponse) => (ev: React.MouseEvent<HTMLButtonElement>) => {
      ev.preventDefault()
      if (
        confirm(
          `Are you sure you want to permanently delete "${form.title}" form? This will automatically delete all submissions.`
        )
        // confirm(
        //   `Are you sure you want to permanently delete "${
        //     form.title
        //   }" form? This will automatically delete${
        //     form.parentEvent
        //       ? ` parent event "${form.parentEvent.title}" and`
        //       : ''
        //   } all submissions.`
        // )
      ) {
        deleteForm(form.id)
      }
    },
    []
  )

  const onDuplicate = React.useCallback(
    (form: FormAdminResponse) => (ev: React.MouseEvent<HTMLButtonElement>) => {
      ev.preventDefault()
      if (
        confirm(
          `Are you sure you want to create a copy of the "${form.title}" form?`
        )
      ) {
        duplicateForm(form.id)
      }
    },
    []
  )

  const columns = React.useMemo(
    () =>
      [
        {
          Header: 'Title',
          accessor: (form: FormAdminResponse) => (
            <>
              {permissions.has(Permissions.forms.AdminManage) ? (
                <Link href={`/admin/forms/${form.id}`} kind="secondary">
                  {trimString(form.title)}
                </Link>
              ) : (
                trimString(form.title)
              )}
            </>
          ),
        },
        {
          Header: 'Form page',
          accessor: (form: FormAdminResponse) => (
            <Link target="_blank" href={`/form/${form.id}`} kind="secondary">
              Link
            </Link>
          ),
        },
        {
          Header: 'Submissions',
          accessor: (form: FormAdminResponse) => (
            <Link href={`/admin/forms/${form.id}/submissions`} kind="secondary">
              {`View ${
                form.submissionsCount ? `(${form.submissionsCount})` : ''
              }`}
            </Link>
          ),
        },
        // {
        //   Header: 'Parent event',
        //   accessor: (form: FormAdminResponse) =>
        //     form.parent_event ? (
        //       <Link href={`/admin/events/${form.parent_event.id}`}>
        //         {form.parent_event.title}
        //       </Link>
        //     ) : null,
        // },
        {
          Header: 'Creator',
          accessor: (form: FormAdminResponse) => {
            const user = usersById[form.creatorUserId]
            return <UserLabel user={user} hideRole />
          },
        },
        {
          Header: 'General access',
          accessor: (form: FormAdminResponse) => (
            <EntityVisibilityTag visibility={form.visibility} />
          ),
        },
        {
          Header: 'People with access',
          accessor: (form: FormAdminResponse) => (
            <span className="inline-block -mr-1">
              {form.allowedRoles.map((x) => (
                <Tag key={x} color="gray" size="small" className="mr-1">
                  {USER_ROLE_BY_ID[x]?.name || x}
                </Tag>
              ))}
            </span>
          ),
        },
        // {
        //   Header: 'Description',
        //   accessor: (form: FormAdminResponse) => trimString(form.description || '')
        // },
        permissions.has(Permissions.forms.AdminManage)
          ? {
              Header: 'Actions',
              accessor: (form: FormAdminResponse) => (
                <span>
                  <Button
                    size="small"
                    className="mr-1"
                    onClick={onDuplicate(form)}
                  >
                    Copy
                  </Button>
                  <Button size="small" onClick={onRemove(form)}>
                    Delete
                  </Button>
                </span>
              ),
            }
          : null,
      ].filter(Boolean),
    [usersById]
  )
  return (
    <div>
      <div className="flex items-center mb-5">
        <H1 className="flex-1 mb-0">Forms</H1>
        {permissions.has(Permissions.forms.AdminManage) && (
          <Button href="/admin/forms/new">Create form</Button>
        )}
      </div>

      {/* Filters */}
      <LabelWrapper label="General access" className="mb-6">
        <Filters
          options={[
            { id: null, name: 'Any' },
            {
              id: EntityVisibility.None,
              name: ENTITY_VISIBILITY_LABEL[EntityVisibility.None],
            },
            {
              id: EntityVisibility.Url,
              name: ENTITY_VISIBILITY_LABEL[EntityVisibility.Url],
            },
            {
              id: EntityVisibility.UrlPublic,
              name: ENTITY_VISIBILITY_LABEL[EntityVisibility.UrlPublic],
            },
          ]}
          onChange={setVisibilityFilter}
          value={visibilityFilter}
          multiple={false}
        />
      </LabelWrapper>

      {forms?.length ? (
        <div className="-mx-8">
          <Table columns={columns} data={forms} />
        </div>
      ) : (
        <div className="text-gray-400 text-center my-12">No data</div>
      )}
    </div>
  )
}
