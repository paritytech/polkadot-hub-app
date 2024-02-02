import {
  Avatar,
  FButton,
  H2,
  Input,
  Modal,
  P,
  showNotification,
} from '#client/components/ui'
import { User } from '#shared/types'
import { useState } from 'react'

const CONFIRMATION_TEXT = 'delete user'

export const DeleteUserModal: React.FC<{
  onClose: () => void
  onDelete?: ({ id }: { id: string }) => void
  user: User
}> = ({ onClose, onDelete, user }) => {
  const [confirmationText, setConfirmationText] = useState('')

  return (
    <Modal onClose={onClose}>
      <div className="flex flex-col justify-center items-center gap-6">
        <H2 className="text-center">Confirm removal of account</H2>
        <div className="flex flex-col sm:flex-row justify-center items-center rounded-md bg-fill-6 p-4">
          <Avatar
            size="normal"
            src={user?.avatar}
            className="mt-4 sm:mt-0 sm:mr-4"
            userId={user?.id}
          />
          <div className="max-w-[230px]">
            <P className="mt-4 sm:mt-0 text-center sm:text-left">
              {user?.fullName}
            </P>
            <div className="text-text-tertiary text-center sm:text-left text-base leading-6">
              {[user.jobTitle, user.team].filter(Boolean).join(' · ')}
            </div>
          </div>
        </div>

        <P textType="additional" className="mt-0 text-text-secondary">
          This account will be permanently deleted in 3 days.
        </P>
      </div>

      <div className="flex flex-col gap-2 mt-6">
        <div>
          {user.email && (
            <Input
              type="email"
              value={confirmationText ?? ''}
              placeholder="Type in the email"
              onChange={(v: any) => setConfirmationText(v)}
              containerClassName="w-full"
            ></Input>
          )}
          {!user.email && (
            <div>
              <P className="ml-2 text-text-secondary">{`Please type "${CONFIRMATION_TEXT}" to confirm`}</P>
              <Input
                type="text"
                value={confirmationText ?? ''}
                placeholder={CONFIRMATION_TEXT}
                onChange={(v: any) => setConfirmationText(v)}
                containerClassName="w-full"
              ></Input>
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-10 sm:gap-2 justify-between items-center mt-4">
          <FButton kind="secondary" onClick={onClose}>
            Cancel
          </FButton>
          <FButton
            className="w-full sm:w-fit"
            onClick={() => {
              if (!user.email && confirmationText !== CONFIRMATION_TEXT) {
                showNotification('Confirmation text is not correct.', 'error')
                return
              }
              if (!!user.email && user.email !== confirmationText) {
                // @todo better error
                showNotification('Email not confirmed.', 'error')
              } else {
                onDelete && onDelete({ id: user.id })
                onClose()
              }
            }}
          >
            Delete
          </FButton>
        </div>
      </div>
    </Modal>
  )
}
