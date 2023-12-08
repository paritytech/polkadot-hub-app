import { OfficeFloorMap } from '#client/components/OfficeFloorMap'
import {
  ComponentWrapper,
  FButton,
  H2,
  HeaderWrapper,
  P,
  UserLabel,
} from '#client/components/ui'
import { showNotification } from '#client/components/ui/Notifications'
import { PermissionsValidator } from '#client/components/PermissionsValidator'
import config from '#client/config'
import * as stores from '#client/stores'
import { VisitStatus } from '#shared/types'
import { propEq } from '#shared/utils/fp'
import { useStore } from '@nanostores/react'
import dayjs from 'dayjs'
import React from 'react'
import { useUserCompact } from '#modules/users/client/queries'
import {
  useUpdateVisit,
  useUpdateVisitAdmin,
  useVisit,
  useVisitsAreas,
} from '../queries'
import { VisitStatusTag } from './VisitStatusTag'
import Permissions from '#shared/permissions'
import { DATE_FORMAT_DAY_NAME_FULL } from '#client/constants'

export const VisitDetail = () => (
  <PermissionsValidator required={[Permissions.visits.Create]} onRejectGoHome>
    <_VisitDetail />
  </PermissionsValidator>
)

export const _VisitDetail = () => {
  const me = useStore(stores.me)
  const page = useStore(stores.router)
  const visitId = page?.route === 'visit' ? page.params.visitId : ''
  const { data: visit = null, refetch: refetchVisit } = useVisit(visitId)
  const { data: user = null } = useUserCompact(visit?.userId || '', {
    enabled: !!visit && visit.userId !== me?.id,
  })
  const { data: areas = [] } = useVisitsAreas(visit?.officeId || '', {
    enabled: !!visit,
  })
  const isOwner = React.useMemo(() => visit?.userId === me?.id, [visit, me])
  const area = React.useMemo(
    () => areas.find(propEq('id', visit?.areaId || '')),
    [areas]
  )
  const office = React.useMemo(
    () =>
      visit ? config.offices.find(propEq('id', visit.officeId)) : undefined,
    [visit]
  )

  const cancellationCallback = () => {
    showNotification(`The office visit has been cancelled.`, 'success')
    refetchVisit()
  }
  const { mutate: updateVisit } = useUpdateVisit(cancellationCallback)
  const { mutate: updateVisitAdmin } = useUpdateVisitAdmin(cancellationCallback)

  const onCancel = (ev: React.MouseEvent) => {
    ev.preventDefault()
    const confirmMessage = `Are you sure to cancel ${
      isOwner ? 'your' : `${user?.fullName}'s`
    } office visit?`
    if (window.confirm(confirmMessage)) {
      const data = { id: visitId, status: 'cancelled' as VisitStatus }
      if (isOwner) {
        updateVisit(data)
      } else {
        updateVisitAdmin(data)
      }
    }
  }
  return (
    <ComponentWrapper>
      {!!visit && (
        <HeaderWrapper title="Office visit">
          <div className="sm:px-6">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex flex-col gap-1">
                  <H2 className="text-md m-0">
                    {dayjs(visit.date).format(DATE_FORMAT_DAY_NAME_FULL)}{' '}
                  </H2>
                  {!isOwner && !!user && (
                    <div className="mb-4">
                      <UserLabel user={user} />
                    </div>
                  )}
                  <div>
                    <P className="m-0">Desk {visit.deskName}</P>
                    <P className="m-0">{visit.areaName}</P>
                    <P className="m-0">
                      {' '}
                      {office?.icon} {office?.name}
                    </P>
                  </div>
                  <div className="mt-4">
                    <VisitStatusTag size="normal" status={visit.status} />
                  </div>
                </div>
                <div className="flex flex-col gap-4 min-w-[224px]">
                  <FButton
                    kind="secondary"
                    className="text-black"
                    onClick={onCancel}
                  >
                    Cancel Visit
                  </FButton>
                  <FButton
                    kind="primary"
                    onClick={() => stores.goTo('visitRequest')}
                  >
                    New Visit
                  </FButton>
                </div>
              </div>
              {!!area && (
                <div className="">
                  <OfficeFloorMap
                    area={area}
                    availableDeskIds={[]}
                    selectedDeskId={visit.deskId}
                    onToggleDesk={() => null}
                  />
                </div>
              )}
            </div>
          </div>
        </HeaderWrapper>
      )}
    </ComponentWrapper>
  )
}
