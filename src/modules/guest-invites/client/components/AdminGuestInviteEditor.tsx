import React, { useCallback, useEffect, useState } from 'react'
import { useStore } from '@nanostores/react'
import dayjs from 'dayjs'
import {
  Breadcrumbs,
  Button,
  ButtonsWrapper,
  H1,
  H2,
  Input,
  LabelWrapper,
  WidgetWrapper,
  showNotification,
} from '#client/components/ui'
import { useDocumentTitle } from '#client/utils/hooks'
import * as stores from '#client/stores'
import config from '#client/config'
import { DatePicker } from '#client/components/DatePicker'
import { useVisitConfig, useVisitsAreas } from '#modules/visits/client/queries'
import { toggleInArray } from '#client/utils'
import { DeskPicker } from '#modules/visits/client/components'
import {
  useCreateGuestInviteAdmin,
  useGuestInvite,
  useUpdateGuestInvite,
} from '../queries'
import { Notifications } from '../helpers'
import { GuestInvite } from '#modules/guest-invites/server/models'

const requiredFields: Array<keyof GuestInvite> = [
  'fullName',
  'deskId',
  'areaId',
  'dates',
]

export const AdminGuestInviteEditor = () => {
  useDocumentTitle('Guest Invite Editor')
  const page = useStore(stores.router)
  const guestInviteId =
    page?.route === 'adminGuestInviteEditor' ? page.params.inviteId : 'new'
  const notNew = guestInviteId !== 'new'

  const officeId = useStore(stores.officeId)
  const office = config.offices.find((o) => o.id == officeId)

  const { data: guestInvite } = notNew
    ? useGuestInvite(guestInviteId)
    : { data: null }

  const { data: areas = [] } = useVisitsAreas(officeId)

  const { mutate: createInvite } = useCreateGuestInviteAdmin(officeId, () => {
    showNotification(Notifications.CreatedSuccess, 'success')
    setFormIsPristine(true)
    stores.goTo('adminGuestInvites')
  })

  const { mutate: updateInvite } = useUpdateGuestInvite(() => {
    showNotification(Notifications.UpdatedSuccess, 'success')
    setFormIsPristine(true)
    stores.goTo('adminGuestInvites')
  })

  // Form
  const [formData, setFormData] = React.useState<any>({
    status: 'confirmed',
    email: '',
    fullName: '',
    code: '',
    office: {
      value: office?.id,
      label: `${office?.name} ${office?.icon || ''}`,
    },
    areaId: null,
    deskId: null,
    dates: [],
  })

  const [formIsPristine, setFormIsPristine] = useState<boolean>(true)
  const onFormChange = useCallback(
    (field: any) => (value: any) => {
      setFormData((x: any) => ({ ...x, [field]: value }))
      setFormIsPristine(false)
    },
    []
  )

  ////////// Date Picker //////////
  const onToggleDate = React.useCallback((date: string) => {
    setFormIsPristine(false)
    setFormData((current: any) => ({
      ...current,
      dates: toggleInArray(current.dates, date, false, 5),
    }))
  }, [])

  const area = React.useMemo(
    () => areas.find((x) => formData.areaId === x.id),
    [formData.areaId]
  )

  const desk = React.useMemo(
    () => area?.desks.find((x) => formData.deskId === x.id),
    [area, formData.deskId]
  )

  const onSubmit = (ev: React.FormEvent) => {
    ev.preventDefault()
    return notNew
      ? updateInvite({ id: guestInviteId, data: formData })
      : createInvite(formData)
  }

  const { data: officeConfig, isFetching: isOfficeConfigFetching } =
    useVisitConfig(officeId || null)

  const formIsValid = React.useMemo<boolean>(() => {
    return requiredFields.every((field) => Boolean(formData[field]))
  }, [requiredFields, formData])

  useEffect(() => {
    if (guestInvite) {
      setFormData(guestInvite as GuestInvite)
    }
  }, [guestInvite])

  return (
    <WidgetWrapper>
      <div className="flex flex-col">
        <H1>
          {notNew
            ? 'Edit Manual Guest Invite Entry'
            : 'Manual Guest Invite Entry'}
        </H1>
        <Breadcrumbs
          items={[
            { label: 'Guest Invites', href: '/admin/guest-invites' },
            {
              label:
                notNew && guestInvite
                  ? guestInvite?.fullName
                  : 'Manual Guest Invite Entry',
            },
          ]}
        />
        <form className="mb-0" onSubmit={onSubmit}>
          <Input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={onFormChange('fullName')}
            label="Full Name"
            placeholder="Guest full name"
            containerClassName="w-full mb-4"
            required={requiredFields.includes('fullName')}
          />

          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={onFormChange('email')}
            label="Email"
            placeholder="Guest email"
            containerClassName="w-full mb-4"
            required={requiredFields.includes('email')}
          />

          <p className="mb-10">
            Choose below the date and Desk your guest is/was using.
          </p>

          <div className="flex flex-col lg:flex-row  gap-4">
            <div className="mb-4 lg:w-[500px] lg:mr-4 lg:mb-0">
              <div>
                <DatePicker
                  workingDays={officeConfig?.workingDays}
                  availableDateRange={officeConfig?.bookableDays ?? []}
                  selectedDates={formData.dates ?? []}
                  onToggleDate={onToggleDate}
                  preReservedDates={[]}
                  reservedDates={[]}
                />
                <div className="mt-10 hidden md:block">
                  <ReservationSummary
                    deskName={desk?.name}
                    areaName={area?.name}
                    dates={formData.dates}
                  />
                </div>
              </div>
            </div>
            <div className="flex-1 flex-shrink">
              <DeskPicker
                officeId={officeId}
                selectedDates={formData.dates}
                selectedDeskId={formData.deskId}
                selectedAreaId={formData.areaId}
                onSelectDesk={onFormChange('deskId')}
                onSelectArea={onFormChange('areaId')}
              />
            </div>
          </div>
          <div className="block lg:hidden mt-10">
            <ReservationSummary
              deskName={desk?.name}
              areaName={area?.name}
              dates={formData.dates ?? []}
            />
          </div>

          <div className="sticky bg-white mt-6 py-4 bottom-0 border-t border-gray-200 px-6 -mx-6 -mb-6 rounded-b-sm">
            <ButtonsWrapper
              left={[
                <Button
                  kind="secondary"
                  onClick={() => stores.goTo('adminGuestInvites')}
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
    </WidgetWrapper>
  )
}

const ReservationSummary = ({
  deskName,
  areaName,
  dates,
}: {
  deskName: string | undefined
  areaName: string | undefined
  dates: Array<string>
}) => {
  return (
    <div>
      <H2 className="hidden lg:block">Reservation summary</H2>
      <LabelWrapper label="Desk">
        <div>{deskName && deskName}</div>
      </LabelWrapper>
      <LabelWrapper label="Area">
        <div>{areaName && areaName}</div>
      </LabelWrapper>
      <LabelWrapper label="Dates">
        <div>
          {' '}
          {dates.map((x, i) => (
            <span key={x} className="whitespace-nowrap mr-1">
              {dayjs(x).format('D MMM')}
              {i !== dates.length - 1 && ','}
            </span>
          ))}
        </div>
      </LabelWrapper>
    </div>
  )
}
