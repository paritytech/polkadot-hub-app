import React, { useEffect, useMemo, useState } from 'react'
import {
  FButton,
  H3,
  Icons,
  Input,
  LoadingPolkadot,
  Modal,
  P,
  Select,
} from '#client/components/ui'
import config from '#client/config'
import { CopyToClipboard } from '#client/components/ui'
import { api } from '#client/utils/api'
import { WalletAggregator, WalletType } from '@polkadot-onboard/core'
import { InjectedWalletProvider } from '@polkadot-onboard/injected-wallets'
import { WalletConnectProvider } from '@polkadot-onboard/wallet-connect/packages/wallet-connect/src'

const DAPP_NAME = config.appName

import {
  AuthSteps,
  Errors,
  ErrorComponent,
  GENERIC_ERROR,
  StepWrapper,
  WhiteWindow,
  providerUrls,
  WalletTab,
} from './helper'
import { sign, verify } from '#client/utils/polkadot'
import { extensionConfig, walletConnectConfig } from './config'
import { cn } from '#client/utils'

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
  const [accounts, setAccounts] = useState<
    Array<{ address: string; name: string; source: string }>
  >([])
  const [selectedAddress, setSelectedAddress] = useState('')
  const [isValidSignature, setIsValidSignature] = useState(false)
  const [userSignature, setUserSignature] = useState<string | null>(null)
  const [error, setError] = useState<JSX.Element | string>()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(AuthSteps.Connecting)
  const [userDetails, setUserDetails] = useState({ fullName: '', email: '' })
  const [walletConnect, setWalletConnect] = useState<any>(null)
  const [showModal, setShowModal] = useState<any>(false)
  const [showTryAgain, setShowTryAgain] = useState<any>(false)
  const [loaderText, setLoaderText] = useState<string>('Connecting')
  const [modalShown, setModalShown] = useState(false)

  const isWalletConnect = (w) => w.type === WalletType.WALLET_CONNECT
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

  const ButtonWrapper = ({
    children,
    className,
  }: {
    children: React.ReactNode
    className?: string
  }) => (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row justify-between w-full mt-6',
        className
      )}
    >
      {children}
    </div>
  )

  const onConnected = {
    [WalletType.WALLET_CONNECT]: async (walletInfo) => {
      try {
        setLoading(true)
        setChosenWallet(walletInfo)
        let accounts = await walletInfo.getAccounts()
        accounts = Array.from(
          new Set(
            accounts
              .filter((a) => a.address.startsWith('1'))
              .map((a) => a.address)
          )
        )
        accounts = accounts.map((addr) => {
          return {
            name: '...' + addr.slice(addr.length - 12, addr.length),
            address: addr,
            source: walletInfo.session.peer.metadata.name,
            wallet: walletInfo,
          }
        })

        setAccounts(accounts)
        setStep(AuthSteps.ChooseAccount)
        setLoading(false)
      } catch (e) {
        setLoading(false)
        console.log(e)
      }
    },
    [WalletType.INJECTED]: async (walletInfo) => {
      try {
        setLoading(true)
        setChosenWallet(walletInfo)
        let accounts = await walletInfo.getAccounts()
        if (!accounts.length) {
          setLoading(false)
          setError(ErrorComponent[Errors.NoAccountsError](walletInfo.metadata))
          setStep(AuthSteps.Error)
          return
        }
        accounts = accounts.map((account) => ({
          ...account,
          source: walletInfo.metadata.id,
          wallet: walletInfo,
        }))
        setAccounts(accounts)
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
        new WalletConnectProvider(walletConnectConfig, DAPP_NAME),
      ])
      setTimeout(async () => {
        walletAggregator
          .getWallets()
          .then((wallets) => {
            setWallets(wallets)
            let confWallets = wallets.map((wallet) => {
              if (isWalletConnect(wallet)) {
                if (!walletConnect) {
                  setWalletConnect(wallet)
                }
                wallet.walletConnectModal.setTheme({
                  themeMode: 'dark',
                  themeVariables: {
                    '--wcm-font-family': 'Unbounded, sans-serif',
                    '--wcm-accent-color': '#E6007A',
                  },
                })
              }
              return wallet
            })
            setWallets(confWallets)
            setStep(AuthSteps.ChooseWallet)
            setLoading(false)
          })
          .catch((e) => {
            console.error(e)
            switch (e.message) {
              case Errors.NoAccountsError:
                setError(ErrorComponent[Errors.NoAccountsError])
                break
              default:
                console.error(e)
                setError(GENERIC_ERROR)
                break
            }
          })
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

      console.log(selectedAccount)
      console.log(account)
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
        // window.location.href = selectedAccount?.source + '://'
        setTimeout(() => {
          setLoaderText('Processing takes about 2-7 seconds')
        }, 5000)
        setTimeout(() => setShowTryAgain(true), 30000)
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

  const updateUser = async (ev: React.FormEvent) => {
    ev.preventDefault()
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
        return (
          <StepWrapper>
            <LoaderWithText />
          </StepWrapper>
        )

      case AuthSteps.ChooseWallet:
        return (
          <StepWrapper
            title="Choose Wallet"
            subtitle={
              <div className="hidden sm:block mb-4">
                {wallets.length === 1 && isWalletConnect(wallets[0]) && (
                  <div>
                    <div className="mb-2">Supported browser extensions</div>
                    <div className="flex gap-2 justify-center">
                      {extensionConfig.supported.map((extension) => (
                        <a key={extension.id} href={extension.urls.main}>
                          <img
                            height="24"
                            width="24"
                            src={extension.image}
                            className="hover:scale-110"
                          ></img>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            }
          >
            <div className="flex flex-col gap-4">
              {wallets.map((ext) => {
                return (
                  <WalletTab
                    key={ext.metadata.id}
                    wallet={ext}
                    name={
                      isWalletConnect(ext)
                        ? 'Wallet Connect'
                        : ext.metadata.title
                    }
                    id={ext.metadata.id}
                    onClickConnect={() => {
                      setShowModal(true)
                      setModalShown(true)
                      onConnected[ext.type](ext)
                    }}
                  />
                )
              })}
            </div>
          </StepWrapper>
        )

      case AuthSteps.ChooseAccount:
        return (
          <StepWrapper title="Choose account">
            <div>
              <Select
                placeholder="select account"
                containerClassName="w-full mb-4"
                value={selectedAddress}
                onChange={(v) => {
                  setSelectedAddress(v)
                  setError('')
                }}
                options={accounts.map((account) => ({
                  label: `${account.name} (${account.source})`,
                  value: account.address,
                }))}
              ></Select>
              <div className="flex align-middle justify-center gap-2 mb-2">
                <Icons.WarningIcon />
                <P
                  textType="additional"
                  className="text-text-secondary mt-0 max-w-[400px] text-left"
                >
                  We strongly recommend to use a separate empty account as
                  identity instead of your wallet with real funds.
                </P>
              </div>
              <ButtonWrapper>
                <FButton
                  className="w-full sm:w-fit h-14 sm:h-full"
                  kind="secondary"
                  size="small"
                  onClick={() => setStep(AuthSteps.ChooseWallet)}
                >
                  Back
                </FButton>
                <FButton
                  className="w-full sm:w-fit h-14  sm:h-full"
                  kind="primary"
                  size="small"
                  onClick={() => handleLogin()}
                  disabled={!selectedAccount}
                >
                  Continue
                </FButton>
              </ButtonWrapper>
            </div>

            {isWalletConnect(chosenWallet) && (
              <WalletTab
                className="w-fit mt-4 mx-auto border-0"
                key={walletConnect.metadata.id}
                wallet={walletConnect}
                name={'Wallet Connect'}
                id={walletConnect.metadata.id}
                onClickConnect={() => {
                  if (!modalShown) {
                    setShowModal(true)
                  }
                  onConnected[WalletType.WALLET_CONNECT](walletConnect)
                }}
                disconnect={true}
              />
            )}
          </StepWrapper>
        )
      case AuthSteps.Warning:
        return (
          <div className="flex flex-col gap-4">
            <StepWrapper title="New account">
              <div className="mb-6">
                <>
                  <div className="flex items-center text-text-secondary justify-between opacity-50">
                    <P>{`${selectedAddress.slice(0, 28)}...`} </P>
                    <CopyToClipboard text={selectedAddress} />
                  </div>
                  <P className="mb-6 mt-0 text-left">
                    {' '}
                    This address is not linked to any account.
                    <br />
                    Do you want to create a new account?
                  </P>
                </>
                <ButtonWrapper className="sm:flex-col">
                  <FButton onClick={createUser}>
                    Yes, create a new account
                  </FButton>
                  <FButton
                    kind="secondary"
                    onClick={() => (window.location.href = googleUrl)}
                  >
                    No, link to my existing Google account.
                  </FButton>
                </ButtonWrapper>
              </div>
            </StepWrapper>
            <FButton
              kind="link"
              href="/login"
              className="mt-4 w-fit m-auto text-text-secondary"
            >
              {' '}
              Go to Login
            </FButton>
          </div>
        )
      case AuthSteps.BasicSetting:
        return (
          <StepWrapper
            title="Set Up Your Profile"
            subtitle={
              'Let us know a few details about you so we know how to properly address you, and how to contact you.'
            }
          >
            <form className="w-5/6 mt-4" onSubmit={updateUser}>
              <Input
                name="fullName"
                type="text"
                placeholder="Your full name"
                value={userDetails.fullName || ''}
                onChange={(value) =>
                  setUserDetails((x) => ({ ...x, fullName: String(value) }))
                }
                containerClassName="w-full"
                className="mb-2"
              />
              <Input
                name="email"
                type="email"
                placeholder="Your contact email"
                value={userDetails.email || ''}
                onChange={(value) =>
                  setUserDetails((x) => ({ ...x, email: String(value) }))
                }
                containerClassName="w-full"
                className="mb-4"
              />
              <FButton className="mt-4" type="submit">
                Continue
              </FButton>
            </form>
          </StepWrapper>
        )
      case AuthSteps.Error:
        return (
          <StepWrapper title="Error">
            {error}
            <FButton
              className="mt-10"
              onClick={() => setStep(AuthSteps.ReConnecting)}
            >
              Try again
            </FButton>
          </StepWrapper>
        )
      case AuthSteps.Redirect:
        return (
          <div className="flex justify-center items-center">
            <LoadingPolkadot />
          </div>
        )
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
