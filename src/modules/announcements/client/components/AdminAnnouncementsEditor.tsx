import React, { useCallback, useEffect, useState } from 'react'
import { useStore } from '@nanostores/react'
import dayjs from 'dayjs'
import {
  Breadcrumbs,
  Button,
  ButtonsWrapper,
  H1,
  Input,
  MarkdownTextarea,
} from '#client/components/ui'
import { EntityAccessSelector } from '#client/components/EntityAccessSelector'
import { showNotification } from '#client/components/ui/Notifications'
import { useDebounce, useDocumentTitle } from '#client/utils/hooks'
import * as stores from '#client/stores'
import { EntityVisibility, AnnouncementItemRequest } from '#shared/types'
import {
  useAnnouncement,
  useCreateAnnouncement,
  useUpdateAnnouncement,
} from '../queries'
import { DATE_FORMAT } from '#client/constants'
import { AnnouncementNotifications } from '../helpers'

const requiredFields: Array<keyof AnnouncementItemRequest> = [
  'title',
  'content',
]

export const AdminAnnouncementsEditor = () => {
  useDocumentTitle('Announcement Editor')
  const page = useStore(stores.router)
  const announcementId =
    page?.route === 'adminAnnouncementEditorPage'
      ? page.params.announcementId
      : 'new'

  const notNew = announcementId !== 'new'

  // Database
  const { data: announcement, refetch: refetchAnnouncement } = notNew
    ? useAnnouncement(announcementId)
    : { data: null, refetch: () => null }

  const { mutate: createAnnouncement, error: createAnnouncementError } =
    useCreateAnnouncement(() => {
      showNotification(AnnouncementNotifications.CreatedSuccess, 'success')
      setFormIsPristine(true)
    })

  const { mutate: updateAnnouncement, error: createUpdateError } =
    useUpdateAnnouncement(announcementId, () => {
      showNotification(AnnouncementNotifications.UpdatedSuccess, 'success')
      setFormIsPristine(true)
      refetchAnnouncement()
    })

  // Form
  const [formData, setFormData] = React.useState<AnnouncementItemRequest>({
    title: '',
    content: '',
    offices: [],
    allowedRoles: [],
    visibility: EntityVisibility.None,
    scheduledAt: dayjs().toDate(),
    expiresAt: dayjs().add(1, 'day').toDate(), // when?
  })

  const [formIsPristine, setFormIsPristine] = useState<boolean>(true)
  const onFormChange = useCallback(
    (field: any) => (value: any) => {
      setFormData((x: any) => ({ ...x, [field]: value }))
      setFormIsPristine(false)
    },
    []
  )
  const onFormBulkChange = React.useCallback((data: Record<string, any>) => {
    setFormData((x) => ({ ...x, ...data }))
    setFormIsPristine(false)
  }, [])

  const onSubmit = useCallback(
    (ev: React.FormEvent) => {
      ev.preventDefault()
      if (dayjs(formData.scheduledAt).isSame(formData.expiresAt)) {
        showNotification(
          'Expiration date has to be at least 1 day after scheduled date.',
          'error'
        )
        setFormIsPristine(true)
        return
      }
      if (dayjs(formData.expiresAt).isBefore(formData.scheduledAt)) {
        showNotification(
          'Expiration date has to be before scheduled date.',
          'error'
        )
        setFormIsPristine(true)
        return
      }
      return notNew
        ? updateAnnouncement(formData)
        : createAnnouncement(formData)
    },
    [notNew, formData]
  )

  const debouncedFormData: AnnouncementItemRequest = useDebounce(formData, 1e3)

  const formIsValid = React.useMemo<boolean>(() => {
    return requiredFields.every((field) => Boolean(formData[field]))
  }, [requiredFields, debouncedFormData])

  useEffect(() => {
    if (announcement) {
      setFormData(announcement)
    }
  }, [announcement])

  return (
    <div>
      <div className="flex flex-col">
        <H1>{notNew ? 'Edit Announcement' : 'Create New Announcement'}</H1>
        <Breadcrumbs
          items={[
            { label: 'Annoucements', href: '/admin/announcements' },
            {
              label:
                notNew && announcement
                  ? announcement?.title
                  : 'New announcement',
            },
          ]}
        />
        <form className="mb-0" onSubmit={onSubmit}>
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

          <Input
            type="text"
            name="title"
            value={formData.title}
            onChange={onFormChange('title')}
            label="Title"
            placeholder="Announcement title"
            containerClassName="w-full mb-4"
            required={requiredFields.includes('title')}
          />

          <MarkdownTextarea
            name="content"
            onChangeValue={onFormChange('content')}
            defaultValue={formData.content || ''}
            label="Content"
            placeholder="Markdown content"
            className="mb-4"
            required={requiredFields.includes('content')}
          />

          <Input
            name="scheduledAt"
            type="date"
            required={true}
            label="Show the announcement starting on"
            value={dayjs(formData.scheduledAt).format(DATE_FORMAT)}
            onChange={(date: any) =>
              onFormChange('scheduledAt')(dayjs(date).format(DATE_FORMAT))
            }
            containerClassName="mb-4"
          />
          <Input
            name="expiresAt"
            type="date"
            required={true}
            label="Hide the announcement starting from"
            value={dayjs(formData.expiresAt).format(DATE_FORMAT)}
            onChange={(date: any) =>
              onFormChange('expiresAt')(dayjs(date).format(DATE_FORMAT))
            }
            containerClassName="mb-4"
          />

          <div className="sticky bg-white mt-6 py-4 bottom-0 border-t border-gray-200 px-8 -mx-8 -mb-8">
            <ButtonsWrapper
              left={[
                <Button
                  kind="secondary"
                  onClick={() => stores.goTo('adminAnnouncementPage')}
                >
                  Cancel
                </Button>,
              ]}
              right={[
                <Button
                  disabled={!formIsValid || formIsPristine}
                  type="submit"
                  kind="primary"
                >
                  {notNew ? 'Update' : 'Create'}
                </Button>,
              ]}
            />
          </div>
        </form>
      </div>
    </div>
  )
}
