import { H1 } from '#client/components/ui'
import { useStore } from '@nanostores/react'
import * as stores from '#client/stores'
import * as React from 'react'
import { LoginButton } from './LoginButton'
import { WhiteWindow } from './helper'
import config from '#client/config'

export const Login: React.FC = () => {
  const me = useStore(stores.me)
  const [currentState, setCurrentState] = React.useState('Login')
  const providers = config.auth.providers

  if (me) {
    stores.goTo('home')
  }

  return (
    <WhiteWindow>
      <div className="flex flex-col items-stretch w-full justify-between h-full">
        <H1>
          {currentState === 'Login'
            ? `Login to ${config.appName}`
            : 'Create new account'}
        </H1>
        <div className="flex flex-col gap-2 m-auto w-[300px]">
          {providers.includes('google') && (
            <LoginButton
              className="w-full"
              label={`${currentState} with Google`}
            />
          )}
          {providers.includes('polkadot') && (
            // @to-do not showing polkadot button on mobile or tablet as we cannot have browser extension on those
            <div className="hidden md:block">
              <LoginButton
                icon="polkadot"
                label={`${currentState} with Polkadot`}
                className="bg-black hover:opacity-80 hover:bg-black w-full"
                provider="polkadot"
                currentState={currentState}
              />
            </div>
          )}
        </div>

        {!!providers.length && <button
          className="underline mt-4"
          onClick={() =>
            setCurrentState(currentState === 'Login' ? 'Register' : 'Login')
          }
        >
          {currentState === 'Login'
            ? 'I want to create a new account'
            : 'I already have an account'}
        </button>}
      </div>
    </WhiteWindow>
  )
}
