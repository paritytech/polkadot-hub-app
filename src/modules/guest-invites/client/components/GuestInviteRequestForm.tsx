import { useStore } from '@nanostores/react'
import React from 'react'
import {
  ButtonsWrapper,
  ComponentWrapper,
  FButton,
  H1,
  Input,
  P,
} from '#client/components/ui'
import { showNotification } from '#client/components/ui/Notifications'
import { PermissionsValidator } from '#client/components/PermissionsValidator'
import * as stores from '#client/stores'
import { GuestInviteRequest } from '#shared/types'
import { useDocumentTitle } from '#client/utils/hooks'
import Permissions from '#shared/permissions'
import { useCreateGuestInvite } from '../queries'

export const GuestInviteRequestForm = () => {
  const officeId = useStore(stores.officeId)
  return (
    <PermissionsValidator
      officeId={officeId}
      required={[Permissions['guest-invites'].Create]}
      onRejectGoHome
    >
      <_GuestInviteRequestForm />
    </PermissionsValidator>
  )
}

export const _GuestInviteRequestForm: React.FC = () => {
  useDocumentTitle('Guest invite')
  const officeId = useStore(stores.officeId)
  const [state, setState] = React.useState<GuestInviteRequest>({
    fullName: '',
    email: '',
  })
  const onFormChange = React.useCallback(
    (field: keyof GuestInviteRequest) => (value: any) => {
      setState((x) => ({ ...x, [field]: value }))
    },
    []
  )
  const { mutate: createGuestInvite, isLoading } = useCreateGuestInvite(
    officeId,
    () => {
      showNotification(
        `The invitation was sent to the guest's email`,
        'success'
      )
      stores.goTo('home')
    }
  )
  const onSubmit = React.useCallback(
    (ev: React.MouseEvent<HTMLButtonElement>) => {
      ev.preventDefault()
      createGuestInvite(state)
    },
    [state]
  )

  const isValid = React.useMemo(() => state.email && state.fullName, [state])

  return (
    <ComponentWrapper>
      <H1 className="font-extra">Invite a guest to the office</H1>
      <P className="mb-8">
        Enter the name and e-mail address of the person you want to invite. They
        will receive a link to fill out personal information about themselves in
        the mail. Once completed, the application will go to our office
        administrators for approval.
      </P>
      <form className="mb-0">
        <Input
          type="text"
          name="guestFullName"
          label="Guest's full name"
          containerClassName="w-full mb-2"
          onChange={onFormChange('fullName')}
          required
        />
        <Input
          type="email"
          name="guestEmail"
          label="Guest's email"
          containerClassName="w-full"
          onChange={onFormChange('email')}
          required
        />
        <ButtonsWrapper
          className="mt-8"
          right={[
            <FButton kind="secondary" href="/">
              Cancel
            </FButton>,
            <FButton
              type="submit"
              kind="primary"
              disabled={!isValid || isLoading}
              onClick={onSubmit}
            >
              {isLoading ? 'Loading...' : 'Submit'}
            </FButton>,
          ]}
        />
      </form>
    </ComponentWrapper>
  )
}
