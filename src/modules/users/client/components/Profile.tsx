import React from 'react'
import { BackButton, ComponentWrapper, H1 } from '#client/components/ui'
import { PermissionsValidator } from '#client/components/PermissionsValidator'
import { useDocumentTitle } from '#client/utils/hooks'
import Permissions from '#shared/permissions'
import { ProfileForm } from './ProfileForm'
import { RootComponentProps } from '#shared/types'

export const Profile: React.FC<RootComponentProps> = (props) => {
  useDocumentTitle('Your profile')
  return (
    <PermissionsValidator required={[Permissions.users.ManageProfile]} onRejectGoHome>
      <ComponentWrapper>
        <BackButton />
        <div className="text-center">
          <H1 className="mt-4 font-extra">Your profile</H1>
        </div>
        <ProfileForm {...props} />
      </ComponentWrapper>
    </PermissionsValidator>
  )
}
