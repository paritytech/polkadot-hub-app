import React, { useState } from 'react'
import dayjs from 'dayjs'
import config, { ClientUserRole } from '#client/config'
import {
  useUsersAdmin,
  useGroupedTags,
  useImportTagsAdmin,
  useUpdateUserAdmin,
  useRevertDeleteAccount,
  useDeleteAccount,
} from '../queries'
import {
  H1,
  HR,
  Table,
  UserRoleLabel,
  Link,
  Tag as TagSpan,
  Button,
  Textarea,
  UserLabel,
  Select,
  Filters,
  LabelWrapper,
  Input,
  Modal,
  RoundButton,
  Icons,
  FButton,
  ButtonsWrapper,
} from '#client/components/ui'
import { showNotification } from '#client/components/ui/Notifications'
import { PermissionsValidator } from '#client/components/PermissionsValidator'
import { pick, prop, propEq, propNotEq } from '#shared/utils/fp'
import { User, ImportedTagGroup, Tag } from '#shared/types'
import { FRIENDLY_DATE_FORMAT, USER_ROLE_BY_ID } from '#client/constants'
import { useDebounce, useDocumentTitle } from '#client/utils/hooks'
import { useStore } from '@nanostores/react'
import * as stores from '#client/stores'
import Permissions from '#shared/permissions'
import { DeleteUserModal } from './DeleteUserModal'

export const AdminUsers: React.FC = () => {
  useDocumentTitle('Users')
  return (
    <PermissionsValidator
      required={[Permissions.users.__Admin, Permissions.users.AdminList]}
      onRejectGoHome
    >
      <PermissionsValidator required={[Permissions.users.ManageProfile]}>
        <TagTable />
        <HR className="my-10" />
      </PermissionsValidator>
      <UserTable />
    </PermissionsValidator>
  )
}

function matchRole(user: User, roles: string[]): boolean {
  return roles.length ? roles.includes(user.role) : true
}
function matchDepartment(user: User, departments: string[]): boolean {
  return departments.length
    ? departments.includes(user.department || '~none~')
    : true
}
function matchSearch(user: User, query: string): boolean {
  const trimmedQuery = query.trim()
  if (!trimmedQuery) return true
  if (user.email.includes(trimmedQuery)) {
    return true
  }
  if (user.fullName.includes(trimmedQuery)) {
    return true
  }
  return false
}

export const UserTable: React.FC = () => {
  const permissions = useStore(stores.permissions)
  const [editedUserId, setEditedUserId] = React.useState<string | null>(null)
  const [departmentFilterIsShown, setDepartmentFilterIsShown] =
    React.useState(false)
  const [roleFilterIsShown, setRoleFilterIsShown] = React.useState(false)
  const [roleFilter, setRoleFilter] = React.useState<string[]>(
    config.roles.filter(propNotEq('lowPriority', true)).map(prop('id'))
  )
  const [departmentFilter, setDepartmentFilter] = React.useState<string[]>([])
  const [searchQuery, setSearchQuery] = React.useState<string>('')
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userForDeletion, setUserForDeletion] = useState<User | null>(null)

  const { data: users = [], refetch } = useUsersAdmin()
  const { mutate: updateUser } = useUpdateUserAdmin(() => {
    showNotification('User role was updated', 'success')
    refetch()
    setEditedUserId(null)
  })

  const { mutate: revert } = useRevertDeleteAccount(() => {
    showNotification('User deletion was reverted', 'success')
    refetch()
  })

  const { mutate: deleteUserAccount } = useDeleteAccount(() => {
    showNotification(
      `The account is scheduled to be deleted in 3 days`,
      'success'
    )
    refetch()
  })

  const onChangeUserRoles = React.useCallback(
    (userId: string) => (roles: string[]) => {
      updateUser({ id: userId, roles })
    },
    []
  )

  const filteredUsers = React.useMemo(() => {
    return users.filter((x) => {
      return !(
        !matchRole(x, roleFilter) ||
        !matchDepartment(x, departmentFilter) ||
        !matchSearch(x, debouncedSearchQuery)
      )
    })
  }, [users, roleFilter, departmentFilter, debouncedSearchQuery])

  const columns = React.useMemo(
    () => [
      {
        Header: 'Name',
        accessor: (x: User) => <UserLabel user={x} hideRole />,
      },
      {
        Header: 'Roles',
        accessor: (u: User) => (
          <>
            <div className="flex items-start">
              <div className="flex-1">
                <div className="-mb-1 -mr-1 flex flex-wrap">
                  {u.roles.map((x) => (
                    <UserRoleLabel key={x} role={x} className="mr-1 mb-1" />
                  ))}
                </div>
              </div>
              {permissions.has(Permissions.users.AdminAssignRoles) && (
                <Button
                  size="small"
                  kind="secondary"
                  onClick={() =>
                    setEditedUserId(editedUserId === u.id ? null : u.id)
                  }
                >
                  Edit
                </Button>
              )}
            </div>
            {editedUserId === u.id && (
              <UserRolesEditorModal
                user={u}
                onClose={() => setEditedUserId(null)}
                onChange={onChangeUserRoles(u.id)}
              />
            )}
          </>
        ),
      },
      {
        Header: 'Email',
        accessor: (x: User) => (
          <Link href={`mailto:${x.email}`} kind="secondary">
            {x.email}
          </Link>
        ),
      },
      {
        Header: 'Department',
        accessor: (u: User) =>
          u.department || <span className="text-gray-300">UNKNOWN</span>,
      },
      {
        Header: 'Created at',
        accessor: (x: User) => dayjs(x.createdAt).format('D MMM, YYYY'),
      },
      {
        Header: 'Delete',
        accessor: (u: User) => {
          if (u.scheduledToDelete && !u.deletedAt) {
            const scheduledAt = dayjs(u.scheduledToDelete).startOf('day')
            const today = dayjs().startOf('day')
            const daysDiff = scheduledAt.diff(today, 'day')
            const difference =
              daysDiff !== 0 ? `in ${daysDiff} days` : 'tonight'

            if (daysDiff < 0) {
              return (
                <div className="text-red-300">Error: User was not deleted.</div>
              )
            }
            return (
              <div className="flex gap-2">
                <div className="text-accents-green">scheduled {difference}</div>
                <Button
                  size="small"
                  kind="secondary"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Are you sure you want to revert scheduled deletion of ${
                          u.fullName
                        } that is planned for ${dayjs(
                          u.scheduledToDelete
                        ).format(FRIENDLY_DATE_FORMAT)}`
                      )
                    ) {
                      revert({ id: u.id })
                    }
                  }}
                >
                  Revert
                </Button>
              </div>
            )
          }
          return (
            <Button
              size="small"
              kind="secondary"
              onClick={() => {
                setShowDeleteModal(true)
                setUserForDeletion(u)
              }}
            >
              {'Delete'}
            </Button>
          )
        },
      },
    ],
    [editedUserId]
  )

  return (
    <div>
      {showDeleteModal && userForDeletion && (
        <DeleteUserModal
          onClose={() => setShowDeleteModal(false)}
          user={userForDeletion}
          onDelete={(userId) => deleteUserAccount(userId)}
        />
      )}
      <H1>Users</H1>

      <div className="flex flex-col gap-y-4 mb-6">
        {!!config.departments && !!config.departments.length && (
          <LabelWrapper label="Department">
            {departmentFilterIsShown ? (
              <Filters
                options={[
                  { id: null, name: 'Any' },
                  ...config.departments.map((x) => ({ id: x, name: x })),
                ]}
                value={departmentFilter}
                onChange={setDepartmentFilter}
                multiple
              />
            ) : (
              <Button
                size="small"
                onClick={() => setDepartmentFilterIsShown(true)}
              >
                Show filter
              </Button>
            )}
          </LabelWrapper>
        )}
        <LabelWrapper label="Role">
          {roleFilterIsShown ? (
            <Filters
              options={[
                { id: null, name: 'Any' },
                ...config.roles.map((x) => ({ id: x.id, name: x.name })),
              ]}
              value={roleFilter}
              onChange={setRoleFilter}
              multiple
            />
          ) : (
            <Button size="small" onClick={() => setRoleFilterIsShown(true)}>
              Show filter
            </Button>
          )}
        </LabelWrapper>
        <LabelWrapper label="Search">
          <Input
            type="text"
            value={searchQuery}
            onChange={setSearchQuery}
            className="px-4 py-[8px]"
            placeholder="By name or email"
            containerClassName="w-full"
          />
        </LabelWrapper>
      </div>

      {!!users.length && (
        <div className="-mx-8">
          {filteredUsers.length ? (
            <Table columns={columns} data={filteredUsers} />
          ) : (
            <div className="text-center text-text-tertiary">No user found</div>
          )}
        </div>
      )}
    </div>
  )
}

const MAX_TAGS_NUMBER = 3
const TagTable: React.FC = () => {
  const { data: tagGroups = [], refetch } = useGroupedTags()
  const { mutate: importTags } = useImportTagsAdmin(() => {
    showNotification('Tags imported successfully', 'success')
    refetch()
  })
  const [collapsed, setCollapsed] = React.useState(true)
  const [isEditable, setIsEditable] = React.useState(false)
  const [jsonValue, setJsonValue] = React.useState('[]')
  const [jsonValueChanged, setJsonValueChanged] = React.useState(false)

  React.useEffect(() => {
    const data: ImportedTagGroup[] = tagGroups.map((x) => ({
      category: x.category,
      tags: (x.tags || []).map(pick(['id', 'name', 'altNames'])),
    }))
    setJsonValue(JSON.stringify(data, null, 2))
    setJsonValueChanged(false)
  }, [tagGroups])

  const tags = React.useMemo(
    () => tagGroups.map(prop('tags')).flat(),
    [tagGroups]
  )
  const displayedTags = React.useMemo(
    () => (collapsed ? tags.slice(0, MAX_TAGS_NUMBER) : tags),
    [collapsed, tags]
  )
  const columns = React.useMemo(
    () => [
      {
        id: '$$tagName',
        Header: 'Name',
        accessor: (x: Tag) => (
          <>
            <TagSpan color="purple" size="small">
              {x.name}
            </TagSpan>
          </>
        ),
      },
      {
        id: '$$tagAltNames',
        Header: 'Alternative names',
        accessor: (x: Tag) => (
          <>
            {(x.altNames || []).map((x) => (
              <TagSpan key={x} color="gray" className="mr-2" size="small">
                {x}
              </TagSpan>
            ))}
          </>
        ),
      },
      {
        id: '$$tagCategory',
        Header: 'Category',
        accessor: (x: Tag) => x.category,
      },
    ],
    []
  )

  const onChangeJsonValue = React.useCallback((value: string) => {
    setJsonValue(value)
    setJsonValueChanged(true)
  }, [])

  const onSubmit = React.useCallback(
    (ev: React.MouseEvent) => {
      ev.preventDefault()
      let data: ImportedTagGroup[] = []
      try {
        data = JSON.parse(jsonValue)
        importTags(data)
      } catch (err) {
        alert('The provided JSON is invalid and cannot be saved.')
      }
    },
    [jsonValue]
  )

  return (
    <div>
      <H1>Tags</H1>
      {!tags.length ? (
        <div className="height-32 flex items-center justify-center text-gray-500">
          No data
        </div>
      ) : (
        <div className="-mx-8">
          <Table columns={columns} data={displayedTags || []} />
        </div>
      )}
      <div className="mt-4">
        {tags.length > MAX_TAGS_NUMBER && collapsed && (
          <Button
            onClick={() => setCollapsed(false)}
            kind="secondary"
            size="small"
            className="mr-2"
          >
            Show all {tags.length} tags
          </Button>
        )}
        <Button
          kind="secondary"
          size="small"
          onClick={() => setIsEditable((x) => !x)}
        >
          Import
        </Button>
      </div>
      {isEditable && (
        <div className="mt-4 relative">
          <Textarea
            rows={10}
            value={jsonValue}
            onChange={onChangeJsonValue}
            className="font-mono text-sm text-blue-500"
          />
          <Button
            disabled={!jsonValueChanged}
            kind="secondary"
            size="small"
            onClick={onSubmit}
            className="absolute top-2 right-2"
          >
            Upload
          </Button>
        </div>
      )}
    </div>
  )
}

const UserRolesEditorModal: React.FC<{
  user: User
  onClose: () => void
  onChange: (roles: string[]) => void
}> = ({ user, ...props }) => {
  const [changed, setChanged] = React.useState(false)
  const [userRoleIds, setUserRoleIds] = React.useState<string[]>(user.roles)

  const userRoles = React.useMemo(() => {
    return userRoleIds.reduce<ClientUserRole[]>((acc, x) => {
      const role = USER_ROLE_BY_ID[x]
      if (!role) return acc
      return acc.concat(role)
    }, [])
  }, [userRoleIds])

  const unsupportedUserRoles = React.useMemo(() => {
    return userRoleIds.reduce<ClientUserRole[]>((acc, x) => {
      if (!USER_ROLE_BY_ID[x]) {
        const unsupportedRole: ClientUserRole = {
          id: x,
          name: x,
          accessByDefault: false,
          lowPriority: false,
        }
        return acc.concat(unsupportedRole)
      }
      return acc
    }, [])
  }, [userRoleIds])

  const availableRoles = React.useMemo(() => {
    return config.roles.filter((x) => !userRoleIds.includes(x.id))
  }, [userRoleIds])

  const onAdd = React.useCallback(
    (roleId: string) => () => {
      setUserRoleIds((roles) => roles.concat(roleId))
      setChanged(true)
    },
    []
  )
  const onRemove = React.useCallback(
    (roleId: string) => () => {
      setUserRoleIds((roles) => roles.filter((x) => x !== roleId))
      setChanged(true)
    },
    []
  )

  const onCloseSafe = React.useCallback(() => {
    if (changed) {
      if (window.confirm('You have unsaved changes. Close anyway?')) {
        props.onClose()
      }
      return
    }
    props.onClose()
  }, [props.onClose, changed])

  return (
    <Modal title="Role editor" size="normal" onClose={onCloseSafe}>
      <div className="mb-6">
        <UserLabel user={user} hideRole />
      </div>
      {!!userRoles.length && (
        <div>
          <div className="text-text-tertiary">User roles</div>
          <div className="flex flex-wrap -mr-1 mb-3">
            {userRoles.map((x) => (
              <TagSpan
                key={x.id}
                size="normal"
                color="purple"
                className="flex gap-x-1 mb-1 mr-1"
              >
                {x.name}
                <button onClick={onRemove(x.id)}>
                  <Icons.Cross fillClassName="fill-purple-200" />
                </button>
              </TagSpan>
            ))}
            {unsupportedUserRoles.map((x) => (
              <TagSpan
                key={x.id}
                size="normal"
                color="purple"
                className="flex gap-x-1 mb-1 mr-1"
              >
                {x.name} <span className="text-text-disabled">UNSUPPORTED</span>
                <button onClick={onRemove(x.id)}>
                  <Icons.Cross fillClassName="fill-purple-200" />
                </button>
              </TagSpan>
            ))}
          </div>
        </div>
      )}
      <div className="text-text-tertiary">Available roles</div>
      <div className="flex flex-wrap -mr-1 mb-5">
        {availableRoles.map((x) => (
          <TagSpan
            key={x.id}
            size="normal"
            color="gray"
            className="mb-1 mr-1 cursor-pointer hover:opacity-70"
            onClick={onAdd(x.id)}
          >
            {x.name}
          </TagSpan>
        ))}
      </div>

      <ButtonsWrapper
        right={[
          <FButton kind="secondary" onClick={props.onClose}>
            Cancel
          </FButton>,
          <FButton
            kind="primary"
            onClick={() => props.onChange(userRoleIds)}
            disabled={!changed}
          >
            Save
          </FButton>,
        ]}
      />
    </Modal>
  )
}
