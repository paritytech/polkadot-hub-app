import React, { useEffect, useMemo, useState } from 'react'
import { FButton, H3, LoadingPolkadot } from '#client/components/ui'
import config from '#client/config'
import { api } from '#client/utils/api'
import { WalletType, BaseWallet } from '@polkadot-onboard/core'

import {
  AuthSteps,
  Errors,
  ErrorComponent,
  GENERIC_ERROR,
  WhiteWindow,
  providerUrls,
  ExtendedMetadata,
  ExtensionAccount,
  isWalletConnect,
  getAccountsByType,
  getWallets,
} from './helper'
import { sign, verify } from '#client/utils/polkadot'
import { AuthStepsComponent } from './steps'
import { WarningModal } from './WarningModal'

const LoaderWithText = ({ text = 'Connecting' }: { text?: string }) => (
  <div className="flex flex-col justify-center items-center">
    <H3>{text}</H3>
    <LoadingPolkadot />
  </div>
)

export const PolkadotProvider: React.FC = () => {
  const [wallets, setWallets] = useState<any>([])
  const [chosenWallet, setChosenWallet] = useState<any>()
  const [accounts, setAccounts] = useState<Array<ExtensionAccount>>([])
  const [selectedAddress, setSelectedAddress] = useState('')
  const [isValidSignature, setIsValidSignature] = useState(false)
  const [userSignature, setUserSignature] = useState<string | null>(null)
  const [step, setStep] = useState(AuthSteps.Connecting)

  const [showModal, setShowModal] = useState<any>(false)
  const [showTryAgain, setShowTryAgain] = useState<any>(false)
  const [modalShown, setModalShown] = useState(false)
  const [loading, setLoading] = useState(false)

  const [loaderText, setLoaderText] = useState<string>('Connecting')
  const [error, setError] = useState<JSX.Element | string>()

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.address === selectedAddress),
    [selectedAddress]
  )
  useEffect(() => {
    if (!config.walletConnectProjectId) {
      console.error(
        ` ${config.appName}: Incorrect WalletConnect configuration.`
      )
    }
  }, [])

  const callbackPath = useMemo(() => {
    const currentUrl = new URL(document.location.href)
    return currentUrl.searchParams.get('callbackPath')
  }, [document.location.href])

  const googleUrl = useMemo(() => {
    const url = new URL(providerUrls.google)
    url.searchParams.append('callbackPath', '/settings')
    if (selectedAccount) {
      url.searchParams.append(
        'account',
        JSON.stringify({
          address: selectedAccount?.address,
          name: selectedAccount?.name,
          source: selectedAccount?.source,
        })
      )
    }
    if (userSignature) {
      url.searchParams.append('signature', userSignature)
    }
    return url.toString()
  }, [selectedAccount, userSignature])

  const polkadotUrl = (path: string) =>
    new URL(`${config.appHost}/auth/polkadot/${path}`).toString()

  useEffect(() => {
    if (step === AuthSteps.ReConnecting) {
      setStep(AuthSteps.Connecting)
      setError('')
    }
    if (step === AuthSteps.Connecting) {
      // the timeout here is to wait for polkadot-js to load after initializing
      setTimeout(async () => {
        try {
          const wallets = await getWallets()
          if (!wallets.length) {
            // if no wallet connect is setup then there is no way to login on mobile
            setError('Please contact administrator.')
            console.error('No wallets were retrieved.')
            setStep(AuthSteps.Error)
            return
          }
          setWallets(wallets)
          setStep(AuthSteps.ChooseWallet)
          setLoading(false)
        } catch (e: any) {
          console.error(e)
          switch (e?.message) {
            case Errors.NoAccountsError:
              setError(
                ErrorComponent[Errors.NoAccountsError](chosenWallet.metadata)
              )
              break
            default:
              console.error(e)
              setError(GENERIC_ERROR)
              break
          }
        }
      }, 1000)
    }
  }, [step])

  useEffect(() => {
    if (isValidSignature && step === AuthSteps.Redirect) {
      window.location.href = '/'
    }
  }, [isValidSignature, step])

  const loginUser = async (signature: string) => {
    try {
      if (!selectedAccount) {
        throw new Error('No account has been selected for login.')
      }
      const account = {
        address: selectedAccount?.address,
        name: selectedAccount?.name,
        source: selectedAccount?.source,
      }
      const { data: response } = await api.post(`${polkadotUrl('users')}`, {
        selectedAccount: account,
        signature,
      })
      if (!response.userRegistered) {
        setLoading(false)
        setStep(AuthSteps.Warning)
        return
      }
      try {
        await api.post(`${polkadotUrl('login')}`, {
          selectedAccount: account,
          signature,
        })
      } catch (e) {
        console.log(e)
        setStep(AuthSteps.Warning)
      }

      setIsValidSignature(true)
      setLoading(false)
      if (callbackPath) {
        window.location.href = callbackPath
      } else {
        setStep(AuthSteps.Redirect)
      }
    } catch (e: any) {
      setError(GENERIC_ERROR)
      console.error(e)
    }
  }

  const createUser = async () => {
    try {
      setLoading(true)
      if (!selectedAccount) {
        throw new Error('No account has been selected for user creation.')
      }
      await api.post(`${polkadotUrl('register')}`, {
        selectedAccount: {
          address: selectedAccount?.address,
          name: selectedAccount?.name,
          source: selectedAccount?.source,
        },
        signature: userSignature,
      })
      setIsValidSignature(true)
      setStep(AuthSteps.BasicSetting)
      setLoading(false)
    } catch (e: any) {
      setError(GENERIC_ERROR)
      console.error(e)
    }
  }

  const handleLogin = async () => {
    try {
      if (!selectedAccount) {
        console.error('Invalid account.')
        return
      }
      if (!isWalletConnect(chosenWallet)) {
        setLoaderText('Please sign the request')
      } else {
        setLoaderText('Connecting to your wallet...')
        setTimeout(
          () => setLoaderText('Processing takes about 2-7 seconds'),
          5000
        )
        setTimeout(() => setShowTryAgain(true), 15000)
      }
      setLoading(true)
      const signature = await sign(
        selectedAccount.address,
        selectedAccount.wallet.signer
      )
      if (signature) {
        setUserSignature(signature)
        const isSignatureValid = verify(selectedAccount.address, signature)
        if (isSignatureValid) {
          await loginUser(signature)
        } else {
          setIsValidSignature(false)
        }
      }
    } catch (e: any) {
      if (e?.message === 'Cancelled') {
        console.error('The user cancelled signing process')
      } else {
        console.error(e)
      }
    }
  }

  const updateUser = async (userDetails: { name: string; email: string }) => {
    try {
      await api.put(`${config.appHost}/user-api/users/me/limited`, userDetails)
      setStep(AuthSteps.Redirect)
    } catch (e) {
      console.error(e)
      setError(GENERIC_ERROR)
    }
  }

  const getStep = (currentStep: string) => {
    switch (currentStep) {
      case AuthSteps.Connecting:
        return AuthStepsComponent[AuthSteps.Connecting]()

      case AuthSteps.ChooseWallet:
        return AuthStepsComponent[AuthSteps.ChooseWallet]({
          wallets,
          onConnected: async (wallet: BaseWallet) => {
            setShowModal(true)
            setModalShown(true)
            setLoading(true)
            setChosenWallet(wallet)
            const accounts = await getAccountsByType[
              wallet.type as WalletType.INJECTED | WalletType.WALLET_CONNECT
            ](wallet)
            // @fix-me fix the return type
            if (!accounts.length) {
              setLoading(false)
              setError(
                ErrorComponent[Errors.NoAccountsError](
                  wallet.metadata as ExtendedMetadata
                )
              )
              setStep(AuthSteps.Error)
            }
            setAccounts(accounts as ExtensionAccount[])
            setStep(AuthSteps.ChooseAccount)
            setLoading(false)
          },
        })
      case AuthSteps.ChooseAccount:
        return AuthStepsComponent.ChooseAccount({
          accounts,
          chosenWallet,
          onAddressSelect: (addr: string) => setSelectedAddress(addr),
          onConnected: async () => {
            setAccounts([])
            if (!modalShown) {
              setShowModal(true)
            }
            const accounts = await getAccountsByType[WalletType.WALLET_CONNECT](
              chosenWallet
            )
            setAccounts(accounts)
          },
          onBack: () => setStep(AuthSteps.ChooseWallet),
          onContinue: () => handleLogin(),
        })

      case AuthSteps.Warning:
        return AuthStepsComponent.Warning({
          selectedAddress,
          onCreateNew: () => createUser(),
          onLink: () => (window.location.href = googleUrl),
        })

      case AuthSteps.BasicSetting:
        return AuthStepsComponent.BasicSetting({ onSubmit: updateUser })

      case AuthSteps.Error:
        return AuthStepsComponent.Error({
          error,
          onTryAgain: () => setStep(AuthSteps.ReConnecting),
        })
      case AuthSteps.Redirect:
        return AuthStepsComponent.Redirect()
      default:
        break
    }
  }

  return (
    <WhiteWindow>
      {showModal && (
        <WarningModal
          onConfirm={() => setShowModal(false)}
          onCancel={() => setShowModal(false)}
        />
      )}
      {!loading && getStep(step)}

      {loading && (
        <div>
          <LoaderWithText text={loaderText} />
          {showTryAgain && (
            <FButton
              kind="link"
              className="mt-2"
              onClick={() => {
                setLoading(false)
                setLoaderText('Connecting')
              }}
            >
              Try again
            </FButton>
          )}
        </div>
      )}
    </WhiteWindow>
  )
}
