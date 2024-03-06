import config from '#client/config'
import { cn } from '#client/utils'
import { useEffect, useState } from 'react'
import { Background, H1, Icons, Link, P } from '../ui'
import {
  BaseWallet,
  WalletType,
  Account,
  WalletAggregator,
} from '@polkadot-onboard/core'
import {
  WalletConnectProvider,
  WalletConnectConfiguration,
} from '@polkadot-onboard/wallet-connect/packages/wallet-connect/src'
import { extensionConfig, walletConnectConfig, themeConfig } from './config'
import { InjectedWalletProvider } from '@polkadot-onboard/injected-wallets'
export const LoginIcons: Record<string, JSX.Element> = {
  google: <Icons.Gmail />,
  polkadot: <Icons.Polkadot />,
}

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

export type ExtensionAccount = {
  address: string
  name: string
  source: string
  wallet: BaseWallet
}

type AddressAccount = { address: string }

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

export const AuthSteps = {
  Connecting: 'Connecting',
  ReConnecting: 'Reconnecting',
  ChooseAccount: 'ChooseAccount',
  ChooseWallet: 'ChooseWallet',
  Warning: 'Warning',
  BasicSetting: 'BasicSetting',
  Redirect: 'Redirect',
  Error: 'Error',
}

export const isWalletConnect = (w: BaseWallet) =>
  w.type === WalletType.WALLET_CONNECT && !!config.walletConnectProjectId

export const GENERIC_ERROR = 'There has been an error. Please try again later'
const MAX_RECONNECT = 3

export const WalletTab: React.FC<{
  wallet: any
  name: string
  id: string
  onClickConnect: (wallet: any) => void
  disconnect?: boolean
  className?: string
}> = ({ wallet, name, id, onClickConnect, disconnect = false, className }) => {
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
      if (disconnect) {
        await wallet.disconnect()
      }
      await wallet.connect()
      setConnected(!!wallet.signer)
      if (!wallet.signer) {
        reConnect()
      }
    } catch (err) {
      console.error('Failed to connect', err)
    }
  }

  useEffect(() => {
    if (connected) {
      onClickConnect(wallet)
    }
  }, [connected])

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

export const getAccountsByType: Record<
  WalletType.WALLET_CONNECT | WalletType.INJECTED,
  (walletInfo: BaseWallet) => Promise<ExtensionAccount[] | []>
> = {
  [WalletType.WALLET_CONNECT]: async (walletInfo: BaseWallet) => {
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

    return uniqueAccounts.map((addr: string) => {
      return {
        name: '...' + addr.slice(addr.length - 12, addr.length),
        address: addr,
        // @ts-ignore // @fixme - define a type in wallet-connect.ts package in polkadot-onboard
        source: walletInfo.session.peer.metadata.name,
        wallet: walletInfo,
      }
    })
  },
  [WalletType.INJECTED]: async (walletInfo: BaseWallet) => {
    let accounts: Account[] = await walletInfo.getAccounts()
    if (!accounts.length) {
      throw new Error(
        'No accounts were injected: browser extension ' + walletInfo.metadata.id
      )
    }
    return accounts.map((account: Account) => ({
      ...account,
      source: walletInfo.metadata.id,
      wallet: walletInfo,
    }))
  },
}

export const getWallets = async () => {
  const aggregatedProviders = []
  aggregatedProviders.push(
    new InjectedWalletProvider(extensionConfig, config.appName)
  )

  if (!!config.walletConnectProjectId) {
    aggregatedProviders.push(
      new WalletConnectProvider(
        walletConnectConfig as WalletConnectConfiguration,
        config.appName
      )
    )
  }
  const walletAggregator = new WalletAggregator(aggregatedProviders)
  const wallets = await walletAggregator.getWallets()
  if (!!wallets.length) {
    return wallets.map((wallet) => {
      if (isWalletConnect(wallet)) {
        // @ts-ignore @fixme export WalletConnectWallet from polkadot-onboard
        wallet.walletConnectModal.setTheme(themeConfig)
      }
      return wallet
    })
  }
  return []
}
