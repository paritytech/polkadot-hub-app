import config from '#client/config'
import { cn } from '#client/utils'
import { useState } from 'react'
import { Background, H1, Icons, Link, P } from '../ui'
import { BaseWallet, WalletType } from '@polkadot-onboard/core'
export const LoginIcons: Record<string, JSX.Element> = {
  google: <Icons.Gmail />,
  polkadot: <Icons.Polkadot />,
}
const { encodeAddress } = require('@polkadot/util-crypto')

export const providerUrls: Record<string, string> = {
  google: `${config.appHost}/auth/google/login`,
  polkadot: `${config.appHost}/polkadot`,
}

export const Errors = {
  NoExtensionError: 'No extension is enabled',
  NoAccountsError: 'No accounts added',
  NoLoginOptionsConfigured: 'No Login Options Configured',
}

export type ExtendedMetadata = {
  id: string
  title: string
  urls?: { main?: string; browsers?: Record<string, string> } & {
    reference: string
  }
}

export const ErrorComponent = {
  [Errors.NoAccountsError]: (metadata: ExtendedMetadata) => (
    <div className="flex flex-col justify-start">
      <P className="text-accents-red text-left">No accounts found.</P>
      <P className="mt-0 text-accents-red">
        {`Please add at least one account to ${metadata.title}.`}
      </P>
      {!!metadata.urls && !!metadata.urls.main && (
        <Link
          target="_blank"
          className="text-text-secondary text-left"
          href={metadata?.urls?.reference ?? metadata.urls.main}
        >
          Check Reference here
        </Link>
      )}
    </div>
  ),
}

export const WhiteWindow: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <Background color="#101015" className="relative">
      <div className="px-2 max-w-[600px] flex flex-col justify-center items-center h-full mx-auto">
        <div
          className={cn(
            'bg-bg-primary  py-10 min-h-[100px] w-full max-h-[540px] px-4 rounded-sm text-center transition-all duration-300 transform'
          )}
        >
          {children}
        </div>
      </div>
    </Background>
  )
}

export enum AuthSteps {
  Connecting = 'Connecting',
  ReConnecting = 'Reconnecting',
  ChooseAccount = 'ChooseAccount',
  ChooseWallet = 'ChooseWallet',
  Warning = 'Warning',
  BasicSetting = 'BasicSetting',
  Redirect = 'Redirect',
  Error = 'Error',
}

const MAX_RECONNECT = 3

function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const WalletTab: React.FC<{
  wallet: BaseWallet
  name: string
  id: string
  onConnected: (wallet: BaseWallet) => void
  onClick?: () => void
  disconnect?: boolean
  className?: string
}> = ({
  wallet,
  name,
  id,
  onConnected,
  onClick,
  disconnect = false,
  className,
}) => {
  const [connected, setConnected] = useState(false)

  const reConnect = async (attempts = 0) => {
    if (attempts === MAX_RECONNECT || connected || !!wallet.signer) {
      return
    }
    await wallet.connect()
    setTimeout(() => reConnect(attempts + 1), attempts * 100)
  }

  const handleConnect = async () => {
    try {
      onClick && onClick()
      if (disconnect) {
        setConnected(false)
        await wallet.disconnect()
        await timeout(1000)
      }
      await wallet.connect()
      setConnected(!!wallet.signer)
      onConnected(wallet)
      if (!wallet.signer) {
        reConnect()
      }
    } catch (err) {
      console.error('Failed to connect', err)
    }
  }

  return (
    <button
      onClick={handleConnect}
      className={cn(
        'h-16 border border-applied-stroke rounded-md flex gap-2 w-full items-center justify-between px-4 max-w-[412px] hover:bg-applied-hover hover:border-applied-hover transition-all delay-100',
        className
      )}
    >
      <div className="flex gap-3">
        <img height="32" width="32" src={id + '-icon.svg'} />
        <P className="text-[18px] capitalize"> {name.replace('-', ' ')}</P>
      </div>
      <div className="rotate-180">
        <Icons.SimpleArrow fillClassName="#848484" width="32px" height="32px" />
      </div>
    </button>
  )
}

export const StepWrapper: React.FC<{
  title?: string
  subtitle?: string | React.ReactNode
  children: React.ReactNode
}> = ({ title, subtitle, children }) => (
  <div className="flex flex-col justify-center items-center">
    <div>
      {title && (
        <H1 className={cn(subtitle ? 'mb-2' : 'mb-8', 'mt-0')}>{title}</H1>
      )}
      {subtitle && (
        <div className="text-text-tertiary text-center max-w-[400px] mt-0 mx-auto">
          {subtitle}
        </div>
      )}
    </div>
    {children}
  </div>
)

export const ButtonWrapper = ({
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

export const getPolkadotAddress = (address: string) => {
  // https://wiki.polkadot.network/docs/learn-account-advanced#address-format
  const isPolkaDotAddress = address.startsWith('1')
  if (isPolkaDotAddress) {
    return address
  } else {
    try {
      return encodeAddress(address, 0)
    } catch (e) {
      console.error(e)
      return ''
    }
  }
}

export const getSubstrateAddress = (address: string) => {
  if (!address) {
    return
  }
  const isSubstrateAddress = address.startsWith('5')
  if (isSubstrateAddress) {
    return address
  } else {
    try {
      return encodeAddress(address)
    } catch (e) {
      console.error(e)
      return ''
    }
  }
}
