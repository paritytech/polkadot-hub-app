import { LoadingPolkadotWithText, Modal, P } from '#client/components/ui'
import React, { useEffect, useMemo, useState } from 'react'
import { AuthStepsComponent } from '#client/components/auth/steps'
import { AuthSteps } from '#client/components/auth/helper'
import { BaseWallet, WalletType } from '@polkadot-onboard/core'
import {
  ExtensionAccount,
  GENERIC_ERROR,
  getAccountsByType,
} from '#client/utils/polkadot-onboard'

export const AuthAccountsLinkModal: React.FC<{
  wallets: any[]
  onChoose: (addr: ExtensionAccount) => Promise<void>
  onCancel: () => void
  loading: boolean
  linkedAddresses: string[]
}> = ({ wallets, onChoose, onCancel, loading, linkedAddresses }) => {
  const [step, setStep] = useState('')
  const [error, setError] = useState<JSX.Element | string>()
  const [selectedAddress, setSelectedAddress] = useState('')
  const [chosenWallet, setChosenWallet] = useState<BaseWallet>()
  const [accounts, setAccounts] = useState<ExtensionAccount[]>([])
  const selectedAccount = useMemo(
    () => accounts.find((a) => a.address === selectedAddress),
    [selectedAddress]
  )
  const getStep = (currentStep: string) => {
    switch (currentStep) {
      case AuthSteps.Connecting:
        return AuthStepsComponent[AuthSteps.Connecting]

      case AuthSteps.ChooseWallet:
        return AuthStepsComponent[AuthSteps.ChooseWallet]({
          wallets,
          onConnected: async (wallet: BaseWallet) => {
            try {
              const accounts = await getAccountsByType[
                wallet.type as WalletType.INJECTED | WalletType.WALLET_CONNECT
              ](wallet)
              setChosenWallet(wallet)
              setAccounts(
                accounts.filter(
                  (account) => !linkedAddresses.includes(account.address)
                )
              )
              setStep(AuthSteps.ChooseAccount)
            } catch (e) {
              console.error(e)
              setError(<p>{GENERIC_ERROR}</p>)
              setStep(AuthSteps.Error)
            }
          },
        })
      case AuthSteps.ChooseAccount:
        return AuthStepsComponent.ChooseAccount({
          accounts,
          chosenWallet,
          onAddressSelect: (addr: string) => setSelectedAddress(addr),
          onConnected: async () => {
            if (chosenWallet) {
              const accounts = await getAccountsByType[
                WalletType.WALLET_CONNECT
              ](chosenWallet)
              setAccounts(accounts)
            }
          },
          onBack: () => setStep(AuthSteps.ChooseWallet),
          onContinue: () => {
            if (selectedAccount) {
              onChoose(selectedAccount)
            }
          },
        })
      case AuthSteps.Error:
        return AuthStepsComponent.Error({
          error,
        })
      case AuthSteps.Redirect:
        return AuthStepsComponent.Redirect
      default:
        break
    }
  }
  useEffect(() => {
    if (!wallets.length) {
      setError('Please contact administrator')
      setStep(AuthSteps.Error)
    }
    if (!!wallets.length && step !== AuthSteps.ChooseWallet) {
      setStep(AuthSteps.ChooseWallet)
    }
  }, [wallets])

  return (
    <Modal onClose={onCancel} title="Link Polkadot Account">
      {loading ? (
        <div className="flex flex-col gap-4 justify-center">
          <LoadingPolkadotWithText text="Getting your data..." />
        </div>
      ) : (
        (getStep(step) as React.ReactNode)
      )}
    </Modal>
  )
}
