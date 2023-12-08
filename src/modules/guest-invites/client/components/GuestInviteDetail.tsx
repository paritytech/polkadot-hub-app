import { PermissionsValidator } from '#client/components/PermissionsValidator'
import {
  ComponentWrapper,
  FButton,
  H2,
  HeaderWrapper,
  P,
  UserLabel,
  showNotification,
} from '#client/components/ui'
import Permissions from '#shared/permissions'
import { useStore } from '@nanostores/react'
import * as stores from '#client/stores'
import { useGuestInvite, useUpdateGuestInviteByUser } from '../queries'
import config from '#client/config'
import { propEq } from '#shared/utils'
import React from 'react'
import dayjs from 'dayjs'
import { GuestInviteStatusTag } from './GuestInviteStatusTag'
import { GuestInviteStatus } from '#shared/types'
import { DATE_FORMAT_DAY_NAME_FULL } from '#client/constants'
import { useVisitsAreas } from '#modules/visits/client/queries'
import { OfficeFloorMap } from '#client/components/OfficeFloorMap'
import { useUserCompact } from '#modules/users/client/queries'

export const GuestInviteDetail = () => (
  <PermissionsValidator
    required={[Permissions['guest-invites'].Create]}
    onRejectGoHome
  >
    <_GuestInviteDetail />
  </PermissionsValidator>
)

export const _GuestInviteDetail = () => {
  const me = useStore(stores.me)
  const page = useStore(stores.router)
  const inviteId =
    page?.route === 'guestInviteDetail' ? page.params.inviteId : ''
  const { data: guestInivite = null, refetch: refetchGuestInvite } =
    useGuestInvite(inviteId)
  const { mutate: updateGuestInvite } = useUpdateGuestInviteByUser(() => {
    showNotification(`Guest invitation has been cancelled.`, 'success')
    refetchGuestInvite()
  })
  const { data: areas = [] } = useVisitsAreas(guestInivite?.office || '', {
    enabled: !!guestInivite,
  })
  const area = React.useMemo(
    () => areas.find(propEq('id', guestInivite?.areaId || '')),
    [areas]
  )
  const desk = area?.desks.find((x) => x.id === guestInivite?.deskId)

  const office = React.useMemo(
    () =>
      guestInivite
        ? config.offices.find(propEq('id', guestInivite.office))
        : undefined,
    [guestInivite]
  )
  const isOwner = React.useMemo(
    () => guestInivite?.creatorUserId === me?.id,
    [guestInivite, me]
  )
  const { data: user = null } = useUserCompact(
    guestInivite?.creatorUserId || '',
    {
      enabled: !!guestInivite && guestInivite.creatorUserId !== me?.id,
    }
  )

  const onCancel = (ev: React.MouseEvent) => {
    ev.preventDefault()
    const confirmMessage = `Are you sure to cancel ${guestInivite?.fullName} invitation to ${office?.name} office?`
    if (window.confirm(confirmMessage)) {
      const data = { id: inviteId, status: 'cancelled' as GuestInviteStatus }
      updateGuestInvite(data)
    }
  }

  return (
    <ComponentWrapper>
      {!!guestInivite && (
        <HeaderWrapper title="Guest invite">
          <div className="sm:px-6">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <H2 className="text-md m-0">
                    {guestInivite.dates.map((d) => (
                      <span key={d}>
                        {dayjs(d).format(DATE_FORMAT_DAY_NAME_FULL)}
                        <br />
                      </span>
                    ))}
                  </H2>
                  {!isOwner && !!user && (
                    <div className="mb-4">
                      <UserLabel user={user} />
                    </div>
                  )}
                  <div className="mt-2">
                    <P className="font-extra text-sm">
                      {guestInivite.fullName}
                    </P>
                    <P className="m-0">Desk {desk?.name}</P>
                    <P className="m-0">{area?.name}</P>
                    <P className="m-0">
                      {' '}
                      {office?.icon} {office?.name}
                    </P>
                  </div>
                  <div className="mt-4">
                    <GuestInviteStatusTag
                      size="normal"
                      status={guestInivite.status}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-4 min-w-[224px]">
                  <FButton
                    kind="secondary"
                    className="text-black"
                    onClick={onCancel}
                  >
                    Cancel Invite
                  </FButton>
                  <FButton
                    kind="primary"
                    onClick={() => stores.goTo('guestInviteRequestForm')}
                  >
                    New Invite
                  </FButton>
                </div>
              </div>
            </div>
            {!!area && (
              <div className="mt-6">
                <OfficeFloorMap
                  area={area}
                  availableDeskIds={[]}
                  selectedDeskId={guestInivite.deskId}
                  onToggleDesk={() => null}
                />
              </div>
            )}
          </div>
        </HeaderWrapper>
      )}
    </ComponentWrapper>
  )
}
