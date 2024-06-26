import { InjectedWalletProvider } from '@polkadot-onboard/injected-wallets'
import config from '#client/config'
import {
  WalletConnectProvider,
  WalletConnectConfiguration,
} from '@polkadot-onboard/wallet-connect/packages/wallet-connect/src'
import { extensionConfig, walletConnectConfig } from '#client/utils/config'
import {
  Account,
  BaseWallet,
  WalletAggregator,
  WalletType,
} from '@polkadot-onboard/core'
import { getAddressType } from './polkadot'

export type ExtensionAccount = {
  address: string
  addressType: string
  name: string
  source: string
  wallet: BaseWallet
}

export const GENERIC_ERROR = 'There has been an error. Please try again later'
export const isWalletConnect = (w: BaseWallet) =>
  w.type === WalletType.WALLET_CONNECT && !!config.walletConnectProjectId

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
  return walletAggregator.getWallets()
}

export const getAccountsByType: Record<
  WalletType.WALLET_CONNECT | WalletType.INJECTED,
  (walletInfo: BaseWallet) => Promise<ExtensionAccount[] | []>
> = {
  [WalletType.WALLET_CONNECT]: async (walletInfo: BaseWallet) => {
    let accounts = await walletInfo.getAccounts()
    const uniqueAccounts = Array.from(new Set(accounts.map((a) => a.address)))
    const formattedAccounts = []
    for (const address of uniqueAccounts) {
      formattedAccounts.push({
        name: `${address.slice(0, 6)}...${address.slice(-12)}`,
        address: address,
        addressType: getAddressType(address),
        source: walletInfo.session.peer.metadata.name,
        wallet: walletInfo,
      })
    }
    return formattedAccounts
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
