import React from 'react'
import { useStore } from '@nanostores/react'
import * as stores from '#client/stores'
import { PermissionsValidator } from '#client/components/PermissionsValidator'
import Permissions from '#shared/permissions'

export const NewjoinerDetector: React.FC = () => (
  <PermissionsValidator required={[Permissions.users.UseOnboarding]}>
    <_NewjoinerDetector />
  </PermissionsValidator>
)

export const _NewjoinerDetector: React.FC = () => {
  const me = useStore(stores.me)
  React.useEffect(() => {
    if (me && !me.isInitialised) {
      stores.goTo('welcome')
    }
  }, [me])
  return null
}
