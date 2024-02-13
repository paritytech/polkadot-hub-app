import * as React from 'react'
import { useStore } from '@nanostores/react'
import config from '#client/config'
import { WidgetWrapper, CTA, CTAType } from '#client/components/ui'
import { PermissionsValidator } from '#client/components/PermissionsValidator'
import * as stores from '#client/stores'
import Permissions from '#shared/permissions'
import * as fp from '#shared/utils/fp'

const requiredPermissions = [
  Permissions.visits.Create,
  Permissions['room-reservation'].Create,
  Permissions['guest-invites'].Create,
]

export const Actions = () => {
  const officeId = useStore(stores.officeId)
  const permissions = useStore(stores.permissions)
  const office = React.useMemo(
    () => config.offices.find(fp.propEq('id', officeId)),
    [officeId]
  )
  if (!permissions.hasAnyOf(requiredPermissions, officeId)) {
    return null
  }
  if (
    !office ||
    (!office.allowDeskReservation &&
      !office.allowGuestInvitation &&
      !office.allowRoomReservation)
  ) {
    return null
  }
  return (
    <WidgetWrapper>
      <div className="flex justify-around items-start -mx-4 -my-4">
        {office.allowDeskReservation && (
          <PermissionsValidator
            officeId={officeId}
            required={[Permissions.visits.Create]}
          >
            <CTA
              type={CTAType.Visit}
              onClick={() => stores.goTo('visitRequest')}
            />
          </PermissionsValidator>
        )}
        {office.allowRoomReservation && (
          <PermissionsValidator
            officeId={officeId}
            required={[Permissions['room-reservation'].Create]}
          >
            <CTA
              type={CTAType.Meeting}
              onClick={() => stores.goTo('roomReservationRequest')}
            />
          </PermissionsValidator>
        )}
        {office.allowGuestInvitation && (
          <PermissionsValidator
            officeId={officeId}
            required={[Permissions['guest-invites'].Create]}
          >
            <CTA
              type={CTAType.Guest}
              onClick={() => stores.goTo('guestInviteRequestForm')}
            />
          </PermissionsValidator>
        )}
      </div>
    </WidgetWrapper>
  )
}
