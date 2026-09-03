import { FButton, H1, P } from '#client/components/ui'
import { useStore } from '@nanostores/react'
import * as stores from '#client/stores'
import * as React from 'react'
import { LoginButton } from './LoginButton'
import { WhiteWindow, oidcErrorMessages } from './helper'
import config from '#client/config'

export const Login: React.FC = () => {
  const me = useStore(stores.me)
  const [currentState, setCurrentState] = React.useState('Login')
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const providers = config.auth.providers

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const error = params.get('error')
    if (error) {
      setErrorMessage(
        oidcErrorMessages[error] || 'An authentication error occurred.'
      )
      params.delete('error')
      const clean = params.toString()
        ? `${window.location.pathname}?${params}`
        : window.location.pathname
      window.history.replaceState({}, '', clean)
    }
  }, [])

  if (me) {
    stores.goTo('home')
  }

  return (
    <WhiteWindow>
      <div className="flex flex-col items-stretch w-full gap-4">
        <H1>
          {currentState === 'Login'
            ? `Login to ${config.appName}`
            : 'Create new account'}
        </H1>
        {errorMessage && (
          <P className="text-accents-red text-center mt-0 mx-4">
            {errorMessage}
          </P>
        )}
        <div className="flex flex-col gap-2 m-auto w-[300px]">
          {providers.includes('google') && (
            <LoginButton
              className="w-full"
              label={`${currentState} with Google`}
            />
          )}
          {/*  browser */}
          {providers.includes('polkadot') && (
            <div className="hidden sm:block">
              <LoginButton
                icon="polkadot"
                label={`${currentState} with Polkadot`}
                className="bg-black hover:opacity-80 hover:bg-black w-full"
                provider="polkadot"
                currentState={currentState}
              />
            </div>
          )}
          {/*  mobile */}
          {providers.includes('polkadot') &&
            !!config.walletConnectProjectId && (
              <div className="block sm:hidden">
                <LoginButton
                  icon="polkadot"
                  label={`${currentState} with Polkadot`}
                  className="bg-black hover:opacity-80 hover:bg-black w-full"
                  provider="polkadot"
                  currentState={currentState}
                />
              </div>
            )}
          {providers.includes('oidc') && (
            <LoginButton
              icon="oidc"
              label="Login with Polkadot SSO"
              className="bg-black hover:opacity-80 hover:bg-black w-full"
              provider="oidc"
            />
          )}
        </div>

        {!!providers.length && (
          <FButton
            kind="link"
            className="mt-4 w-fit m-auto"
            onClick={() =>
              setCurrentState(currentState === 'Login' ? 'Register' : 'Login')
            }
          >
            {currentState === 'Login'
              ? 'I want to create a new account'
              : 'I already have an account'}
          </FButton>
        )}
      </div>
    </WhiteWindow>
  )
}
