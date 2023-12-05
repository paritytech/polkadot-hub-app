import React from 'react'
import config from '#client/config'
import { ComponentWrapper, H1 } from '#client/components/ui'
import { PermissionsValidator } from '#client/components/PermissionsValidator'
import { UsersMap } from './UsersMap'
import Permissions from '#shared/permissions'

export const UsersMapPage: React.FC = () => {
  return (
    <PermissionsValidator required={[Permissions.users.UseMap]} onRejectGoHome>
      <ComponentWrapper wide>
        <H1 className="mt-4 font-extra text-center">{config.companyName} people</H1>
        <UsersMap mapContainerClassName="h-4/6" />
      </ComponentWrapper>
    </PermissionsValidator>
  )
}
