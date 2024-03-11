import React, { useEffect, useState } from 'react'
import { useDocumentTitle, useOffice } from '#client/utils/hooks'
import {
  BackButton,
  Background,
  ComponentWrapper,
  FButton,
  H1,
  H2,
  HR,
  Icons,
  P,
  showNotification,
} from '#client/components/ui'
import { useStore } from '@nanostores/react'
import * as stores from '#client/stores'
import {
  useDeleteMyAccount,
  useUnlinkAccount,
  useUpdateLinkedAccounts,
} from '../queries'
import { sign, verify } from '#client/utils/polkadot'
import { AuthAccountsLinkModal } from './AuthAccountsLinkModal'
import { AuthAccount } from './AuthAccount'
import { AuthAddressPair, AuthExtension } from '#shared/types'
import config from '#client/config'
import { filterOutForbiddenAuth } from '../helpers'
import { DeleteUserModal } from './DeleteUserModal'
import dayjs from 'dayjs'
import { DATE_FORMAT_DAY_NAME } from '#client/constants'
import { WalletType } from '@polkadot-onboard/core'
import { getWallets } from '#client/components/auth/helper'

export const MySettings: React.FC = () => {
  useDocumentTitle('Settings')
  // @todo move to some config?
  const allowedWallets = ['polkadot-js', 'talisman']
  const me = useStore(stores.me)
  const [showModal, setShowModal] = useState(false)
  const [wallets, setWallets] = useState<any>([])
  const [linkedAccounts, setLinkedAccounts] = useState<
    Record<string, AuthAddressPair[]>
  >({})
  const [loading, setLoading] = useState(false)

  const officeId = useStore(stores.officeId)
  const office = useOffice(officeId)

  const { mutate: updateLinked } = useUpdateLinkedAccounts(() => {
    showNotification('Account successfully linked', 'success')
    setTimeout(() => (window.location.href = '/settings'), 1000)
  })
  const { mutate: unlinkAccount } = useUnlinkAccount(() => {
    showNotification('Account successfully removed', 'success')
    setTimeout(() => (window.location.href = '/settings'), 1000)
  })

  const { mutate: deleteMyAccount } = useDeleteMyAccount(() => {
    showNotification(
      `The account is scheduled to be deleted in 3 days`,
      'success'
    )
    setTimeout(() => (window.location.href = '/settings'), 2000)
  })
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    if (me) {
      const res = filterOutForbiddenAuth(me.authIds, allowedWallets)
      setLinkedAccounts(res ?? [])
    }
  }, [me])

  const authenticateWithPolkadot = async () => {
    setLoading(true)
    setShowModal(true)
    setTimeout(async () => {
      try {
        const wallets = await getWallets()
        setWallets(wallets)
        setLoading(false)
      } catch (e: any) {
        console.error(e)
        showNotification(
          'There has been an error. Please try again later or contact the administrator',
          'error'
        )
        console.error(e)
      }
    }, 1000)
  }

  const providerComponents: Record<string, JSX.Element> = {
    google: (
      <AuthAccount
        icon={<Icons.Gmail />}
        title="Gmail"
        subtitle="Easily login using your Gmail account."
        connected={!!me?.email}
        onConnect={() => {
          const url = new URL(`http://127.0.0.1:3000/auth/google/login`)
          url.searchParams.append('callbackPath', '/settings')
          window.location.href = url.toString()
        }}
      >
        {me?.email && (
          <P textType="additional" className="text-text-secondary mt-0">
            Connected email: {me?.email}
          </P>
        )}
      </AuthAccount>
    ),
    polkadot: (
      <AuthAccount
        icon={<Icons.Polkadot />}
        title="Polkadot"
        subtitle="Connect your polkadot wallet using browser extensions like: polkadot-js or talisman. You can connect as many wallets as you want."
        connected={false}
        onConnect={authenticateWithPolkadot}
      >
        {me?.authIds &&
          linkedAccounts &&
          !!Object.keys(linkedAccounts).length && (
            <div>
              {Object.keys(linkedAccounts).map(
                (extensionName: string, idx: number) => (
                  <div key={extensionName}>
                    {linkedAccounts[extensionName].map((acc) => (
                      <div
                        className="grid grid-rows-3 sm:grid-rows-1 sm:grid-cols-8 items-center mb-4"
                        key={acc.address}
                      >
                        <P
                          textType="additional"
                          className="text-text-secondary mb-1 mt-1 sm:col-span-4"
                        >
                          {acc.name} ({extensionName})
                        </P>
                        <P
                          textType="additional"
                          className="text-text-tertiary my-0 sm:col-span-3"
                        >
                          {' '}
                          {`${acc.address.slice(0, 16)}...`}
                        </P>
                        <FButton
                          kind="link"
                          className="text-sm justify-self-start -ml-2 sm:justify-self-end"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Are you sure you want to unlink ${acc.name}?`
                              )
                            ) {
                              unlinkAccount({
                                ...acc,
                                extensionName: extensionName as AuthExtension,
                              })
                            }
                          }}
                        >
                          Unlink
                        </FButton>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}
      </AuthAccount>
    ),
  }

  return (
    <Background>
      {showDeleteModal && me && (
        <DeleteUserModal
          onClose={() => setShowDeleteModal(false)}
          onDelete={() => deleteMyAccount()}
          user={me}
        />
      )}
      {showModal && (
        <AuthAccountsLinkModal
          wallets={wallets}
          loading={loading}
          linkedAccounts={linkedAccounts}
          onChoose={async (selectedAccount: any) => {
            try {
              if (!selectedAccount) {
                console.error('Invalid account.')
                return
              }
              setLoading(true)
              const signature = await sign(
                selectedAccount.address,
                selectedAccount.wallet.signer
              )
              if (signature) {
                const isSignatureValid = verify(
                  selectedAccount.address,
                  signature
                )
                if (isSignatureValid) {
                  setShowModal(false)
                  updateLinked({
                    address: selectedAccount?.address,
                    name: selectedAccount?.name,
                    extensionName: selectedAccount?.source,
                  })
                } else {
                  showNotification('error while linking account', 'error')
                }
              }
            } catch (e: any) {
              if (e?.message === 'Cancelled') {
                console.error('The user cancelled signing process')
              } else {
                console.error(e)
              }
            }
          }}
          onCancel={() => setShowModal(false)}
        />
      )}
      <ComponentWrapper>
        <BackButton />
        <H1>Settings</H1>
        <div className="mt-10 flex flex-col gap-10">
          <div>
            <H2>Connected accounts</H2>
            <div className="flex flex-col gap-4">
              {!!config.auth.providers.length &&
                config.auth.providers.map(
                  (provider, index) =>
                    (
                      <div key={`${provider}-${index}`}>
                        {!!index && <HR className="mb-6" />}
                        {providerComponents[provider]}
                      </div>
                    ) ?? ''
                )}
            </div>
          </div>
          <div>
            <H2>Delete user data</H2>
            <div className="grid grid-rows-2 justify-between items-start">
              <P textType="additional" className="mt-0 text-text-tertiary">
                You can delete your account with all its data if you wish so.
                All the data will be permanently deleted within 3 days of your
                request.
              </P>
              {me?.scheduledToDelete && (
                <P className="mt-0" textType="additional">
                  Your account is scheduled to be deleted on{' '}
                  {dayjs(me?.scheduledToDelete)
                    .tz(office?.timezone)
                    .format(DATE_FORMAT_DAY_NAME + ' H:mm')}
                </P>
              )}
              {!me?.scheduledToDelete && !me?.deletedAt && (
                <button
                  className="text-text-secondary underline text-left"
                  onClick={() => {
                    setShowDeleteModal(true)
                  }}
                >
                  Delete my user account
                </button>
              )}
            </div>
          </div>
        </div>
      </ComponentWrapper>
    </Background>
  )
}
