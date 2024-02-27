import { ApiPromise, Keyring, WsProvider } from '@polkadot/api'
import type {
  InjectedAccountWithMeta,
  InjectedExtension,
} from '@polkadot/extension-inject/types'
import { web3Accounts, web3Enable } from '@polkadot/extension-dapp'
import config from '#client/config'
import { stringToU8a } from '@polkadot/util'
import { signatureVerify } from '@polkadot/util-crypto'

/**
 * Polkadot js browser extension docs
 * https://polkadot.js.org/docs/extension/cookbook/
 */

/**
 * {
  "address": "5F3zHzGe5Kih4sZ2KwxvcpRjc5Easew5ZPV",
  "meta": {
    "name": "dots",
    "source": "talisman"
  },
  "type": "sr25519"
}
 */

export const connectToPolkadot = async (): Promise<WsProvider> => {
  const provider = new WsProvider('wss://rpc.polkadot.io')
  await ApiPromise.create({ provider })
  return provider
}

export const enablePolkadotExtension = async (): Promise<InjectedExtension[]> =>
  // this call fires up the authorization popup
  web3Enable(`${config.appName} | ${config.companyName}`)

// get a list of extensions from users's browser and suggest user which one to pick
export const getAccountsList = (): Promise<InjectedAccountWithMeta[]> =>
  web3Accounts()

export const verify = (address: string, signature: string) => {
  try {
    const newKeyring = new Keyring({ type: 'sr25519' })
    const keyring = newKeyring.addFromAddress(address)

    if (!config.authMessageToSign) {
      console.log(
        'Make sure the Shared Message is set in the .env file, set value for AUTH_MESSAGE_TO_SIGN'
      )
      return false
    }
    const messageToSign = stringToU8a(config.authMessageToSign)
    return signatureVerify(messageToSign, signature, keyring.publicKey)
  } catch (e) {
    console.error(e)
  }
}

export const sign = async (address: string, signer) => {
  try {
    if (!config.authMessageToSign) {
      console.log(
        'Make sure the Shared Message is set in the .env file, set value for AUTH_MESSAGE_TO_SIGN'
      )
      return null
    }
    const signRaw = await signer.signRaw
    const { signature } = await signRaw({
      address: address,
      data: config.authMessageToSign,
      type: 'bytes',
    })
    return signature
  } catch (e) {
    console.error(e)
  }
  return null
}
