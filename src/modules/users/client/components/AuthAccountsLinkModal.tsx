import { FButton, H1, Link, Modal, P, Select } from '#client/components/ui'
import React, { useState } from 'react'
import type {
  InjectedAccountWithMeta,
  InjectedExtension,
} from '@polkadot/extension-inject/types'

const ExtensionError = () => (
  <div>
    <P className="text-accents-red">Error: No extension is enabled</P>
    <P className="">
      <Link
        target="_blank"
        className="text-text-secondary"
        href="https://polkadot.js.org/extension/"
      >
        Download polkadot-js browser extension
      </Link>
    </P>
  </div>
)

const AccountError = () => (
  <div>
    <P className="text-accents-red">Error: There are no accounts to connect.</P>
    <P className="text-text-secondary mb-2 mt-0" textType="additional">
      - All of your accounts are already connected or
      <br /> - No accounts are added to your browser extension.
    </P>
  </div>
)

export const AuthAccountsLinkModal: React.FC<{
  accounts: Array<InjectedAccountWithMeta>
  extensions: Array<InjectedExtension>
  onChoose: (addr: InjectedAccountWithMeta) => Promise<void>
  onCancel: () => void
}> = ({ accounts, extensions, onChoose, onCancel }) => {
  const [selectedAccount, setSelectedAccount] = useState('')
  return (
    <Modal onClose={onCancel}>
      <div className="flex flex-col gap-4 justify-center">
        <H1 className="text-center">Choose account</H1>

        {!extensions.length ? (
          <ExtensionError />
        ) : !accounts.length ? (
          <AccountError />
        ) : (
          <div className="flex flex-col gap-4">
            <Select
              placeholder="select account"
              value={selectedAccount}
              onChange={setSelectedAccount}
              disabled={!accounts.length}
              options={[
                {
                  label: !accounts.length
                    ? 'nothing to select'
                    : 'select account',
                  value: '',
                },
              ].concat(
                accounts.map((account: InjectedAccountWithMeta) => ({
                  label: account.meta.name ?? '',
                  value: account.address ?? '',
                }))
              )}
            ></Select>
            <div className="flex flex-col">
              <FButton
                disabled={!selectedAccount}
                onClick={() => {
                  const account = accounts.find(
                    (a) => a.address === selectedAccount
                  )
                  if (account) {
                    onChoose(account)
                  }
                }}
              >
                Link
              </FButton>
              <button
                onClick={onCancel}
                className="mt-4 hover:opacity-80 text-text-tertiary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
