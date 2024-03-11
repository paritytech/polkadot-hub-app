import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useStore } from '@nanostores/react'
import dayjs from 'dayjs'
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
  Select,
  WidgetWrapper,
} from '#client/components/ui'
import { showNotification } from '#client/components/ui/Notifications'
import * as stores from '#client/stores'
import { EntityVisibility, EventCreationRequest } from '#shared/types'
import { generateId } from '#client/utils'
import { pick, propNotEq } from '#shared/utils/fp'
import { useDebounce, useDocumentTitle } from '#client/utils/hooks'
import { useForms } from '#modules/forms/client/queries'
import {
  useCreateEvent,
  useEvent,
  useEventsAdmin,
  useResponsibleUsers,
  useUpdateEvent,
} from '../queries'

const DateFormat = 'YYYY-MM-DDTHH:mm'

export const AdminEventEditor: React.FC = () => {
  const page = useStore(stores.router)
  const me = useStore(stores.me)
  const eventId = page?.route === 'adminEvent' ? page.params.eventId : 'new'

  const { data: forms } = useForms()
  const { data: events, refetch: refetchEvents } = useEventsAdmin()

  const [showUsersList, setShowUsersList] = useState<boolean>(false)
  const onToggleUsersList = useCallback(() => setShowUsersList((x) => !x), [])

  const [userFilterQuery, serUserFilterQuery] = useState<string>('')

  const { data: users } = useResponsibleUsers()
  const filteredUsers = useMemo(() => {
    const query = userFilterQuery.toLowerCase()
    return (users || []).filter((x) => {
      return (
        x.fullName.toLowerCase().includes(query) ||
        x.email.toLowerCase().includes(query)
      )
    })
  }, [users, userFilterQuery])

  const { data: event, refetch: refetchEvent } =
    eventId !== 'new' ? useEvent(eventId) : { data: null, refetch: () => null }

  useDocumentTitle(
    eventId !== 'new' ? event?.title || 'Loading...' : 'New Event'
  )

  const requiredFields = React.useMemo<
    Array<keyof Partial<EventCreationRequest>>
  >(() => ['title', 'startDate', 'endDate', 'confirmationRule', 'location'], [])
  const [formData, setFormData] = React.useState<EventCreationRequest>({
    title: '',
    description: '',
    content: '',
    formId: null,
    offices: [],
    allowedRoles: [],
    visibility: EntityVisibility.None,
    startDate: dayjs().toDate(),
    endDate: dayjs().add(1, 'day').toDate(),
    address: '',
    mapUrl: '',
    location: '',
    locationLat: null,
    locationLng: null,
    coverImageUrl: null,
    checklist: [],
    confirmationRule: 'none',
    notificationRule: 'none',
    metadata: {},
    responsibleUserIds: [],
  })
  const debouncedFormData: EventCreationRequest = useDebounce(formData, 1e3)
  const formIsValid = React.useMemo<boolean>(() => {
    return requiredFields.every((field) => Boolean(formData[field]))
  }, [requiredFields, debouncedFormData])

  useEffect(() => {
    if (event) {
      const data = pick([
        'title',
        'description',
        'content',
        'formId',
        'startDate',
        'endDate',
        'mapUrl',
        'address',
        'location',
        'locationLat',
        'locationLng',
        'coverImageUrl',
        'checklist',
        'confirmationRule',
        'notificationRule',
        'offices',
        'visibility',
        'allowedRoles',
        'responsibleUserIds',
      ])(event)
      setFormData({
        ...data,
      } as EventCreationRequest)
      if (event.responsibleUserIds?.length) {
        setShowUsersList(true)
      }
    }
  }, [event])

  const [formIsPristine, setFormIsPristine] = useState<boolean>(true)
  const onFormChange = useCallback(
    (field: keyof EventCreationRequest) => (value: any) => {
      setFormData((x) => ({ ...x, [field]: value }))
      setFormIsPristine(false)
    },
    []
  )

  const onFormBulkChange = React.useCallback((data: Record<string, any>) => {
    setFormData((x) => ({ ...x, ...data }))
    setFormIsPristine(false)
  }, [])

  const onAddChecklistItem = useCallback(
    (ev: React.MouseEvent<HTMLButtonElement>) => {
      ev.preventDefault()
      setFormData((x) => ({
        ...x,
        checklist: [...x.checklist, { id: generateId(8, 'ch_'), text: '' }],
      }))
    },
    []
  )
  const onChangeChecklistItem = useCallback(
    (itemId: string, field: keyof EventCreationRequest['checklist'][0]) =>
      (value: any) => {
        setFormData((x) => ({
          ...x,
          checklist: x.checklist.map((item) => {
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
  const onRemoveChecklistItem = useCallback(
    (itemId: string) => (ev: React.MouseEvent<HTMLButtonElement>) => {
      ev.preventDefault()
      setFormData((x) => ({
        ...x,
        checklist: x.checklist.filter(propNotEq('id', itemId)),
      }))
      setFormIsPristine(false)
    },
    []
  )

  const formsUsageById = useMemo(() => {
    const result: Record<string, boolean> = {}
    if (!forms?.length || !events?.length) {
      return result
    }
    forms.forEach((form) => {
      result[form.id] = events.map((x) => x.formId).some((x) => x === form.id)
    })
    if (event?.formId) {
      result[event.formId] = false
    }
    return result
  }, [forms, events, event])

  const { mutate: createEvent, error: createEventError } = useCreateEvent(
    () => {
      stores.goTo('adminEvents')
      showNotification('The event has been created', 'success')
      setFormIsPristine(true)
    }
  )

  const { mutate: updateEvent, error: updateEventError } = useUpdateEvent(
    eventId,
    () => {
      // stores.goTo('adminEvents')
      showNotification('The event has been updated', 'success')
      setFormIsPristine(true)
      refetchEvent()
    }
  )

  const onSubmit = useCallback(
    (ev: React.FormEvent) => {
      ev.preventDefault()
      return event ? updateEvent(formData) : createEvent(formData)
    },
    [event, formData]
  )

  const onChangeUserFilterQuery = useCallback(
    (value: any) => serUserFilterQuery(value),
    []
  )

  return (
    <WidgetWrapper>
      <Breadcrumbs
        items={[
          { label: 'Events', href: '/admin/events' },
          { label: event?.title || 'New event' },
        ]}
      />
      <form className="mb-0" onSubmit={onSubmit}>
        <H1>{eventId === 'new' ? 'New event' : `Event "${event?.title}"`}</H1>

        <EntityAccessSelector
          value={{
            visibility: formData.visibility,
            allowedRoles: formData.allowedRoles,
            offices: formData.offices,
          }}
          fields={['visibility', 'allowedRoles', 'offices']}
          visibilityTypes={[
            EntityVisibility.None,
            EntityVisibility.Url,
            EntityVisibility.Visible,
          ]}
          onChange={onFormBulkChange}
          containerClassName="my-6"
        />

        <Input
          type="text"
          name="title"
          value={formData.title}
          onChange={onFormChange('title')}
          label="Title"
          placeholder="Unique event name"
          containerClassName="w-full mb-4"
          required={requiredFields.includes('title')}
        />

        <MarkdownTextarea
          name="description"
          onChangeValue={onFormChange('description')}
          defaultValue={formData.description || ''}
          label="Intro / Description"
          placeholder="A general description of the event, so people understand what it is about."
          className="mb-4"
          required={requiredFields.includes('description')}
        />

        <MarkdownTextarea
          name="content"
          onChangeValue={onFormChange('content')}
          defaultValue={formData.content || ''}
          label="Content for applicants"
          placeholder="This content will only be displayed to the event applicants who were approved by admin. E.g. location details."
          className="mb-4"
          required={requiredFields.includes('content')}
        />

        <Input
          name="startDate"
          type="datetime-local"
          required={requiredFields.includes('startDate')}
          label="Start date"
          value={dayjs(formData.startDate).format(DateFormat)}
          onChange={(date: any) =>
            onFormChange('startDate')(dayjs(date, DateFormat))
          }
          containerClassName="mb-4"
        />

        <Input
          name="endDate"
          type="datetime-local"
          required={requiredFields.includes('endDate')}
          label="End date"
          value={dayjs(formData.endDate).format(DateFormat)}
          onChange={(date: any) =>
            onFormChange('endDate')(dayjs(date, DateFormat))
          }
          containerClassName="mb-4"
        />

        <Input
          name="location"
          type="text"
          required={requiredFields.includes('location')}
          label="Location"
          value={formData.location || ''}
          onChange={onFormChange('location')}
          containerClassName="mb-4 w-full"
          placeholder="City, Country 🏳"
        />

        <Input
          name="address"
          type="text"
          required={requiredFields.includes('address')}
          label="Address"
          value={formData.address || ''}
          onChange={onFormChange('address')}
          containerClassName="mb-4 w-full"
          placeholder="Exact address"
        />

        <Input
          name="mapUrl"
          type="text"
          required={requiredFields.includes('mapUrl')}
          label="Google Maps URL"
          value={formData.mapUrl || ''}
          onChange={onFormChange('mapUrl')}
          containerClassName="mb-4 w-full"
          placeholder="https://goo.gl/maps/..."
        />

        <Select
          label="Form questionnaire"
          className="mb-4"
          name="formId"
          value={formData.formId || undefined}
          placeholder="Select form"
          options={[{ label: 'No form', value: 'none' }].concat(
            (forms || []).map((x) => {
              const isUsed = formsUsageById[x.id]
              const canBeAnonymous = x.visibility === EntityVisibility.UrlPublic
              return {
                label: `${x.title}${
                  isUsed
                    ? ' (used by another event)'
                    : canBeAnonymous
                    ? ' (can be submitted anonymously)'
                    : ''
                }`,
                value: x.id,
                disabled: isUsed || canBeAnonymous,
              }
            })
          )}
          onChange={onFormChange('formId')}
          required={requiredFields.includes('formId')}
        />

        <RadioGroup
          name="confirmationRule"
          onChange={onFormChange('confirmationRule')}
          value={formData.confirmationRule}
          label="Confirmation rule"
          options={[
            { value: 'none', label: 'Manual confirmation' },
            {
              value: 'auto_confirm',
              label: 'Auto-confirm for all applications',
            },
            // TODO: ?
            // {
            //   value: 'auto_confirm_custom',
            //   label: 'Auto-confirm for a specified list of roles',
            // },
          ]}
          containerClassName="mb-4"
          required={requiredFields.includes('confirmationRule')}
        />

        <div className="my-6">
          <LabelWrapper label="Direct notifications">
            {!showUsersList ? (
              <Button size="small" onClick={onToggleUsersList}>
                Enable
              </Button>
            ) : (
              <div className="border border-gray-300 rounded-sm">
                <div className="mx-2 mt-2">
                  <Input
                    type="text"
                    containerClassName="w-full"
                    placeholder="Search by name or email"
                    onChange={onChangeUserFilterQuery}
                  />
                </div>
                <div className="overflow-y-scroll p-2 h-48">
                  <CheckboxGroup
                    name="responsibleUserIds"
                    value={formData.responsibleUserIds}
                    onChange={onFormChange('responsibleUserIds')}
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
            )}
          </LabelWrapper>
        </div>

        <LabelWrapper className="my-6" label="Checklist">
          <div>
            <Button size="small" onClick={onAddChecklistItem}>
              Add item
            </Button>
            {!!formData.checklist.length && (
              <div className="mt-4">
                {formData.checklist.map((item, i) => (
                  <div className="flex items-center mb-2" key={item.id}>
                    <div className="mr-4">#{i + 1}</div>
                    <Input
                      type="text"
                      value={item.text}
                      placeholder="Text (markdown)"
                      onChange={onChangeChecklistItem(item.id, 'text')}
                      containerClassName="mr-4 flex-1 w-full"
                      required
                    />
                    <Button
                      size="small"
                      onClick={onRemoveChecklistItem(item.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </LabelWrapper>
        <Input
          label="Cover Image"
          type="text"
          value={formData.coverImageUrl || ''}
          placeholder="https://example.com/cover.jpg"
          onChange={onFormChange('coverImageUrl')}
          containerClassName="w-full mb-4"
        />

        <div className="sticky bg-white mt-6 py-4 bottom-0 border-t border-gray-200 px-6 -mx-6 -mb-6 rounded-b-sm">
          <ButtonsWrapper
            right={[
              <Button
                disabled={!formIsValid || formIsPristine}
                type="submit"
                kind="primary"
              >
                {event ? 'Update event' : 'Create event'}
              </Button>,
            ]}
          />
        </div>
      </form>
    </WidgetWrapper>
  )
}
