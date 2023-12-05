import { useStore } from '@nanostores/react'
import dayjs from 'dayjs'
import * as React from 'react'
import { EntityAccessSelector } from '#client/components/EntityAccessSelector'
import {
  Avatar,
  Breadcrumbs,
  Button,
  ButtonsWrapper,
  CheckboxGroup,
  H1,
  Input,
  LabelWrapper,
  MarkdownTextarea,
  RadioGroup,
} from '#client/components/ui'
import { showNotification } from '#client/components/ui/Notifications'
import { DATE_FORMAT } from '#client/constants'
import Permissions from '#shared/permissions'
import * as stores from '#client/stores'
import {
  Checklist,
  ChecklistType,
  ChecklistTypeLabels,
  EntityVisibility,
  GeneralChecklistItem,
} from '#shared/types'
import { propNotEq } from '#shared/utils/fp'
import { generateId } from '#client/utils'

import { useUsersCompact } from '#modules/users/client/queries'
import {
  useChecklist,
  useCreateChecklist,
  useUpdateChecklist,
} from '../queries'

type ChecklistForm = Pick<
  Checklist,
  | 'title'
  | 'items'
  | 'type'
  | 'allowedRoles'
  | 'visibility'
  | 'joinedDate'
  | 'offices'
  | 'userIds'
>

export const AdminChecklistEditor = () => {
  const page = useStore(stores.router)
  const formInitialValue: ChecklistForm = {
    title: '',
    items: [],
    type: 'all',
    allowedRoles: [],
    visibility: EntityVisibility.None,
    joinedDate: dayjs().toDate(),
    offices: [],
    userIds: [],
  }
  const [formIsPristine, setFormIsPristine] = React.useState<boolean>(true)
  const [userQuery, setUserQuery] = React.useState('')
  const [formData, setFormData] =
    React.useState<ChecklistForm>(formInitialValue)
  const checklistId = React.useMemo(() => {
    if (page?.route === 'adminChecklistEditor') {
      return page.params?.checklistId
    }
    return 'new'
  }, [page])
  const { data: ch, refetch: refetchChecklist } =
    checklistId !== 'new'
      ? useChecklist(checklistId)
      : { data: null, refetch: () => null }

  const requiredFields: Array<keyof ChecklistForm> = ['title', 'type', 'items']

  React.useEffect(() => {
    if (ch) {
      setFormData({
        title: ch?.title,
        items: ch?.items,
        type: ch?.type,
        allowedRoles: ch?.allowedRoles,
        visibility: ch?.visibility,
        joinedDate: ch?.joinedDate,
        offices: ch?.offices,
        userIds: ch?.userIds,
      })
    }
  }, [ch])

  const permissions = useStore(stores.permissions)

  const onFormChange = (field: any) => (value: any) => {
    setFormData((x: ChecklistForm) => ({ ...x, [field]: value }))
    setFormIsPristine(false)
  }

  const onFormBulkChange = React.useCallback((data: Record<string, any>) => {
    setFormData((x) => ({ ...x, ...data }))
    setFormIsPristine(false)
  }, [])

  const allowUserSelect = React.useMemo(
    () => permissions.has(Permissions.checklists.AdminManage),
    [permissions]
  )
  const { data: users = [] } = useUsersCompact(undefined, {
    enabled: allowUserSelect,
    retry: false,
  })

  const onChangeUserQuery = React.useCallback(
    (value: any) => setUserQuery(value),
    []
  )
  const filteredUsers = React.useMemo(() => {
    const query = userQuery.toLowerCase()
    if (!query) return users
    return (users || []).filter((x) => {
      return (
        x.fullName.toLowerCase().includes(query) ||
        x.email.toLowerCase().includes(query)
      )
    })
  }, [users, userQuery])

  const onAddChecklistItem = React.useCallback(
    (ev: React.MouseEvent<HTMLButtonElement>) => {
      ev.preventDefault()
      setFormData((x: ChecklistForm) => ({
        ...x,
        items: [...x.items, { id: generateId(8, 'ch_'), label: '' }],
      }))
      setFormIsPristine(false)
    },
    []
  )
  const onRemoveChecklistItem = React.useCallback(
    (itemId: string) => (ev: React.MouseEvent<HTMLButtonElement>) => {
      ev.preventDefault()
      setFormData((x: ChecklistForm) => ({
        ...x,
        items: x.items.filter(propNotEq('id', itemId)),
      }))
      setFormIsPristine(false)
    },
    []
  )
  const onChangeChecklistItem = React.useCallback(
    (itemId: string, field: string) => (value: any) => {
      setFormData((x: ChecklistForm) => ({
        ...x,
        items: x.items.map((item) => {
          if (item.id === itemId) {
            return { ...item, [field]: value }
          }
          return item
        }),
      }))
      setFormIsPristine(false)
    },
    []
  )

  const { mutate: create } = useCreateChecklist(() => {
    stores.goTo('adminChecklist')
    setFormIsPristine(true)
  })

  const { mutate: update, error: updateChecklistError } = useUpdateChecklist(
    checklistId,
    () => {
      if (updateChecklistError) {
        showNotification(
          'There has been an error, please try again later.',
          'error'
        )
      } else {
        showNotification('The checklist has been updated', 'success')
        refetchChecklist()
      }
      setFormIsPristine(true)
    }
  )

  const onSubmit = (ev: React.FormEvent) => {
    ev.preventDefault()
    if (
      !formData?.items.length ||
      formData.items.find((item: { id: string; label: string }) => !item.label)
    ) {
      showNotification('No checklist items added or empty items.', 'error')
      return
    }
    return ch ? update(formData) : create(formData)
  }

  return (
    <div>
      <div className="flex flex-col justify-start sm:justify-between mb-4">
        <Breadcrumbs
          items={[
            { label: 'Checklists', href: '/admin/checklists' },
            { label: ch?.title || 'New checklist' },
          ]}
        />
        <H1>Checklists</H1>
      </div>

      <EntityAccessSelector
        value={{
          visibility: formData.visibility,
          allowedRoles: formData.allowedRoles,
          offices: formData.offices,
        }}
        fields={['visibility', 'allowedRoles', 'offices']}
        visibilityTypes={[EntityVisibility.None, EntityVisibility.Visible]}
        onChange={onFormBulkChange}
        containerClassName="my-6"
      />

      <form className="mb-0" onSubmit={onSubmit}>
        <div className="flex flex-col gap-4">
          <RadioGroup
            label="User type"
            name="type"
            onChange={onFormChange('type')}
            value={formData.type}
            options={ChecklistTypeLabels}
            required={requiredFields.includes('type')}
          />
          {formData.type === ChecklistType.new && (
            <Input
              name="joinedDate"
              type="date"
              required={formData.type === ChecklistType.new}
              label="Joined from date"
              value={dayjs(formData.joinedDate).format(DATE_FORMAT)}
              onChange={(date: any) =>
                onFormChange('joinedDate')(dayjs(date).format(DATE_FORMAT))
              }
              containerClassName="mb-4"
            />
          )}
          {formData.type === ChecklistType.selected && (
            <div className="my-6">
              <LabelWrapper label="Direct notifications">
                <div className="border border-gray-300 rounded-sm">
                  <div className="mx-2 mt-2">
                    <Input
                      type="text"
                      className="w-full"
                      placeholder="Search by name or email"
                      onChange={onChangeUserQuery}
                    />
                  </div>
                  <div className="overflow-y-scroll p-2 h-48">
                    <CheckboxGroup
                      name="userIds"
                      value={formData.userIds}
                      onChange={onFormChange('userIds')}
                      options={filteredUsers.map((user) => ({
                        value: user.id,
                        label: (
                          <div className="inline-flex items-center">
                            <Avatar
                              src={user.avatar}
                              size="small"
                              className="mr-2"
                            />
                            {user.fullName}
                            <span className="opacity-30 ml-2">
                              ({user.email})
                            </span>
                          </div>
                        ),
                      }))}
                    />
                  </div>
                </div>
              </LabelWrapper>
            </div>
          )}
          <Input
            label="Title"
            value={formData.title}
            type="text"
            onChange={onFormChange('title')}
            placeholder="Start typing name or email"
            className="w-full"
            required={requiredFields.includes('title')}
          />
          <div className="my-6">
            <LabelWrapper label="Checklist items">
              <div className="flex flex-col w-full">
                <Button
                  size="small"
                  className="w-fit mb-4"
                  onClick={onAddChecklistItem}
                >
                  Add item
                </Button>
                <div className="flex flex-col">
                  {formData?.items?.map(
                    (item: GeneralChecklistItem, i: number) => (
                      <div
                        className="grid sm:grid-cols-[7%_70%_10%] gap-4 mb-8"
                        key={item.id}
                      >
                        <div className="mr-4">#{i + 1}</div>
                        <MarkdownTextarea
                          name={`checklistItem-${item.id}`}
                          onChangeValue={onChangeChecklistItem(
                            item.id,
                            'label'
                          )}
                          defaultValue={item.label}
                          placeholder="Checklist item Markdown content"
                          className="pt-5 w-full"
                          required={requiredFields.includes('items')}
                        />
                        <div>
                          <Button
                            size="small"
                            onClick={onRemoveChecklistItem(item.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </LabelWrapper>
          </div>
          <div className="sticky bg-white mt-6 py-4 bottom-0 border-t border-gray-200 px-8 -mx-8 -mb-8">
            <ButtonsWrapper
              right={[
                <Button disabled={formIsPristine} type="submit" kind="primary">
                  {ch ? 'Update checklist' : 'Create checklist'}
                </Button>,
              ]}
            />
          </div>
        </div>
      </form>
    </div>
  )
}
