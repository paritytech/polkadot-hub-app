import React, { useEffect, useMemo, useState } from 'react'
import { FButton, H3, LoadingPolkadot, Modal, P } from '#client/components/ui'
import config from '#client/config'
import { api } from '#client/utils/api'
import {
  WalletAggregator,
  WalletType,
  BaseWallet,
  Account,
} from '@polkadot-onboard/core'
import { InjectedWalletProvider } from '@polkadot-onboard/injected-wallets'
import {
  WalletConnectProvider,
  WalletConnectConfiguration,
} from '@polkadot-onboard/wallet-connect/packages/wallet-connect/src'

const DAPP_NAME = config.appName

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
} from './helper'
import { sign, verify } from '#client/utils/polkadot'
import { extensionConfig, themeConfig, walletConnectConfig } from './config'
import { AuthStepsComponent } from './steps'

type ModalProps = {
  onConfirm: () => void
  onCancel: () => void
  className?: string
}

export const ConfirmationModal: React.FC<ModalProps> = ({
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal onClose={onCancel} title="Important information">
      <div className="flex flex-col gap-4">
        <div>
          <P className="font-bold mb-0">Please be patient</P>
          <p className="mt-0 text-text-secondary">
            Signature/sign requests to your wallet might take a while to
            propagate (2-5 seconds).
          </p>
        </div>

        <div className="block sm:hidden">
          <P className="font-bold mb-0">No redirect back from wallet</P>
          <p className="text-text-secondary">
            After your sign the request in you wallet, you will need to manually
            return back to the browser to continue.
          </p>
        </div>
        <FButton onClick={onConfirm} className="w-full rounded-sm">
          Noted
        </FButton>
      </div>
    </Modal>
  )
}

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

  const callbackPath = useMemo(() => {
    const currentUrl = new URL(document.location.href)
    return currentUrl.searchParams.get('callbackPath')
  }, [document.location.href])

  const googleUrl = useMemo(() => {
    const url = new URL(providerUrls.google)
    url.searchParams.append('callbackPath', '/settings')
    url.searchParams.append(
      'account',
      JSON.stringify({
        address: selectedAccount?.address,
        name: selectedAccount?.name,
        source: selectedAccount?.source,
      })
    )
    if (userSignature) {
      url.searchParams.append('signature', userSignature)
    }
    return url.toString()
  }, [selectedAccount, userSignature])

  const polkadotUrl = (path: string) =>
    new URL(`${config.appHost}/auth/polkadot/${path}`).toString()

  type AddressAccount = { address: string }

  const onConnected: Record<
    WalletType.WALLET_CONNECT | WalletType.INJECTED,
    (walletInfo: BaseWallet) => void
  > = {
    [WalletType.WALLET_CONNECT]: async (walletInfo: BaseWallet) => {
      try {
        setLoading(true)
        setChosenWallet(walletInfo)
        let accounts = await walletInfo.getAccounts()
        // sometimes there are duplicate accounts returned
        // issue in polkadot-onboard @fix-me
        const uniqueAccounts: string[] = Array.from(
          new Set(
            accounts
              .filter((a: AddressAccount) => a.address.startsWith('1'))
              .map((a: AddressAccount) => a.address)
          )
        )

        setAccounts(
          uniqueAccounts.map((addr: string) => {
            return {
              name: '...' + addr.slice(addr.length - 12, addr.length),
              address: addr,
              // @ts-ignore // @fixme - define a type in wallet-connect.ts package in polkadot-onboard
              source: walletInfo.session.peer.metadata.name,
              wallet: walletInfo,
            }
          })
        )
        setStep(AuthSteps.ChooseAccount)
        setLoading(false)
      } catch (e) {
        setLoading(false)
        console.log(e)
      }
    },
    [WalletType.INJECTED]: async (walletInfo: BaseWallet) => {
      try {
        setLoading(true)
        setChosenWallet(walletInfo)
        let accounts: Account[] = await walletInfo.getAccounts()
        if (!accounts.length) {
          setLoading(false)
          setError(
            ErrorComponent[Errors.NoAccountsError](
              walletInfo.metadata as ExtendedMetadata
            )
          )
          setStep(AuthSteps.Error)
          return
        }
        accounts = accounts.map((account: Account) => ({
          ...account,
          source: walletInfo.metadata.id,
          wallet: walletInfo,
        }))
        setAccounts(accounts as ExtensionAccount[])
        setStep(AuthSteps.ChooseAccount)
        setLoading(false)
      } catch (e) {
        setLoading(false)
        console.log(e)
      }
    },
  }

  useEffect(() => {
    if (step === AuthSteps.ReConnecting) {
      setStep(AuthSteps.Connecting)
      setError('')
    }
    if (step === AuthSteps.Connecting) {
      let walletAggregator = new WalletAggregator([
        new InjectedWalletProvider(extensionConfig, DAPP_NAME),
        new WalletConnectProvider(
          walletConnectConfig as WalletConnectConfiguration,
          DAPP_NAME
        ),
      ])
      // the timeout here is to wait for polkadot-js to load after initializing
      setTimeout(async () => {
        try {
          const wallets = await walletAggregator.getWallets()
          let confWallets = wallets.map((wallet) => {
            if (isWalletConnect(wallet)) {
              // @ts-ignore @fixme export WalletConnectWallet from polkadot-onboard
              wallet.walletConnectModal.setTheme(themeConfig)
            }
            return wallet
          })
          setWallets(confWallets)
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
        return AuthStepsComponent[AuthSteps.Connecting]

      case AuthSteps.ChooseWallet:
        return AuthStepsComponent[AuthSteps.ChooseWallet]({
          wallets,
          onClickConnect: (wallet: BaseWallet) => {
            setShowModal(true)
            setModalShown(true)
            onConnected[
              wallet.type as WalletType.INJECTED | WalletType.WALLET_CONNECT
            ](wallet)
          },
        })
      case AuthSteps.ChooseAccount:
        return AuthStepsComponent.ChooseAccount({
          accounts,
          chosenWallet,
          onAddressSelect: (addr: string) => setSelectedAddress(addr),
          onWalletConnectClick: () => {
            if (!modalShown) {
              setShowModal(true)
            }
            onConnected[WalletType.WALLET_CONNECT](chosenWallet)
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
        return AuthStepsComponent.Redirect
      default:
        break
    }
  }

  return (
    <WhiteWindow>
      {showModal && (
        <ConfirmationModal
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
