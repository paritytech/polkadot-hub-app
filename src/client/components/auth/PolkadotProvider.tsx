import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BackButton,
  FButton,
  Icons,
  Input,
  Link,
  P,
  Select,
  Warning,
} from '#client/components/ui'
import config from '#client/config'
import { CopyToClipboard } from '#client/components/ui'
import { api } from '#client/utils/api'
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types'
import {
  AuthSteps,
  Errors,
  ErrorComponent,
  GENERIC_ERROR,
  LoadingPolkadot,
  StepWrapper,
  WhiteWindow,
  providerUrls,
} from './helper'
import { WsProvider } from '@polkadot/api'
import {
  connectToPolkadot,
  enablePolkadotExtension,
  getAccountsList,
  sign,
  verify,
} from '#client/utils/polkadot'

export const PolkadotProvider: React.FC = () => {
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([])
  const [selectedAddress, setSelectedAddress] = useState('')
  const [isValidSignature, setIsValidSignature] = useState(false)
  const [userSignature, setUserSignature] = useState<string | null>(null)
  const [error, setError] = useState<JSX.Element | string>()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(AuthSteps.Connecting)
  const [userDetails, setUserDetails] = useState({ fullName: '', email: '' })

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
    url.searchParams.append('account', JSON.stringify(selectedAccount))
    if (userSignature) {
      url.searchParams.append('signature', userSignature)
    }
    return url.toString()
  }, [selectedAccount, userSignature])

  const polkadotUrl = (path: string) =>
    new URL(`${config.appHost}/auth/polkadot/${path}`).toString()

  useEffect(() => {
    let socket: WsProvider
    connectToPolkadot()
      .then((sock) => {
        socket = sock
        return enablePolkadotExtension()
      })
      .then((extensions) => {
        if (!extensions.length) {
          throw new Error(Errors.NoExtensionError)
        }
        return getAccountsList()
      })
      .then((accounts) => {
        if (!accounts.length) {
          throw new Error(Errors.NoAccountsError)
        }
        setAccounts(accounts)
        setStep(AuthSteps.ChooseAccount)
      })
      .catch((e) => {
        console.error(e)
        switch (e.message) {
          case Errors.NoExtensionError:
            setError(ErrorComponent[Errors.NoExtensionError])
            break
          case Errors.NoAccountsError:
            setError(ErrorComponent[Errors.NoAccountsError])
            break
          default:
            setError(GENERIC_ERROR)
            break
        }
      })
    return () => {
      socket && socket.disconnect()
    }
  }, [])

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
      const { data: response } = await api.post(`${polkadotUrl('users')}`, {
        selectedAccount,
        signature,
      })
      if (!response.userRegistered) {
        setStep(AuthSteps.Warning)
        return
      }
      await api.post(`${polkadotUrl('login')}`, {
        selectedAccount,
        signature,
      })
      setIsValidSignature(true)
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
        selectedAccount,
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
      const signature = await sign(selectedAccount)
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
          <StepWrapper title="Connecting to Polkadot Extension...">
            {!error && <LoadingPolkadot />}
            {error && <div>{error}</div>}
          </StepWrapper>
        )
      case AuthSteps.ChooseAccount:
        return (
          <div className="grid grid-cols-[1fr_2fr_1fr]">
            <div>
              <BackButton className="self-start" />
            </div>
            <StepWrapper
              title="Choose your account"
              subtitle={`Works with Polkadot Js and Talisman`}
            >
              <div>
                <Select
                  placeholder="select account"
                  containerClassName="w-full mt-4 mb-2"
                  value={selectedAddress}
                  onChange={(v) => {
                    setSelectedAddress(v)
                    setError('')
                  }}
                  options={[{ label: 'select account', value: '' }].concat(
                    accounts.map((account) => ({
                      label: `${account.meta.name} (${account.meta.source})`,
                      value: account.address,
                    }))
                  )}
                ></Select>
                <div className="flex align-middle justify-center gap-2 mb-14">
                  <Icons.WarningIcon />
                  <P
                    textType="additional"
                    className="text-text-secondary mt-0 max-w-[400px] text-left"
                  >
                    We strongly recommend to use a separate empty account as
                    identity instead of your wallet with real funds.
                  </P>
                </div>
              </div>
              <FButton
                className="w-full"
                kind="primary"
                size="small"
                onClick={() => handleLogin()}
              >
                Continue
              </FButton>
              {error && <div className="text-accents-red">{error}</div>}
            </StepWrapper>
          </div>
        )
      case AuthSteps.Warning:
        return (
          <div className="flex flex-col gap-4">
            <StepWrapper title="New account?">
              {loading && <LoadingPolkadot />}
              {!loading && (
                <>
                  <>
                    <P className="text-center mb-0">
                      This address is not linked to any account
                    </P>
                    <div className="flex items-center text-text-secondary justify-center">
                      <P>{`${selectedAddress.slice(0, 24)}...`} </P>
                      <CopyToClipboard text={selectedAddress} />
                    </div>
                  </>
                  <div className="flex flex-col gap-4">
                    <FButton onClick={createUser}>
                      Yes, create a new account
                    </FButton>
                    <FButton
                      kind="secondary"
                      onClick={() => (window.location.href = googleUrl)}
                    >
                      No, link to my existing Google account.
                    </FButton>
                  </div>
                </>
              )}
            </StepWrapper>
            <Link className="text-text-secondary" href="/login">
              Go to Login
            </Link>
          </div>
        )
      case AuthSteps.BasicSetting:
        return (
          <StepWrapper
            title="Complete Setting Up Your Profile"
            subtitle={
              'Let us know a few details about you so we know how to properly address you, and how to contact you.'
            }
          >
            <form className="w-full" onSubmit={updateUser}>
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
              <FButton type="submit">Continue</FButton>
            </form>
          </StepWrapper>
        )
      case AuthSteps.Redirect:
        return <div></div>
      default:
        return <div>Unknown state. Please contact administrator</div>
    }
  }

  return (
    <WhiteWindow>
      <div className="flex flex-col items-center justify-center">
        {getStep(step)}
      </div>
    </WhiteWindow>
  )
}
