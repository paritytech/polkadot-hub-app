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

export const connectToPolkadot = async (): Promise<ApiPromise> => {
  const provider = new WsProvider('wss://rpc.polkadot.io')
  const api = await ApiPromise.create({ provider })
  await api.isReady
  return api
}

export const connectToWestend = async (): Promise<ApiPromise> => {
  const provider = new WsProvider('wss://westend-rpc.polkadot.io')
  const api = await ApiPromise.create({ provider })
  await api.isReady
  return api
}

// export const enablePolkadotExtension = async (): Promise<InjectedExtension[]> =>
//   // this call fires up the authorization popup
//   web3Enable(`${config.appName} | ${config.companyName}`)

// // get a list of extensions from users's browser and suggest user which one to pick
// export const getAccountsList = (): Promise<InjectedAccountWithMeta[]> =>
//   web3Accounts()

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
const unitToPlanck = (units: string, decimals: number) => {
  let [whole, decimal] = units.toString().split('.')

  if (typeof decimal === 'undefined') {
    decimal = ''
  }

  return `${whole}${decimal.padEnd(decimals, '0')}`.replace(/^0+/, '')
}

// @todo add this to admin side
const receiverAddress = '5CURyEXsS6UFpe3w6bvELw9m7X6BtbTXcJs1jifxfxs8msHv'
// const providerSocket =
//   process.env.NODE_ENV === 'production'
//     ? 'wss://rpc.polkadot.io'
//     : 'wss://westend-rpc.polkadot.io'

export const makePaymentTransaction = async (
  senderAddress: string,
  signer,
  amountToSend: string,
  callback: (value: any) => void
) => {
  const api = await connectToPolkadot()
  if (!!api && !!signer) {
    // amountToSend = amountToSend * 100
    const amount = unitToPlanck(
      amountToSend,
      api?.registry?.chainDecimals[0] || 10
    )
    try {
      await api.tx.balances
        .transferKeepAlive(receiverAddress, amount)
        .signAndSend(
          '5F7aECSMP77dwPYMjyHAbN1FHbxQGMFFCi5pcYQC7CYdouQs',
          { signer },
          (res) => {
            callback(res)
            if (res.status.isInBlock) {
              console.log(
                `Completed at block hash #${res.status.asInBlock.toString()}`
              )
            } else {
              console.log(`Current status: ${res.status.type}`)
            }
          }
        )
    } catch (e) {
      throw new Error(e?.message)
    }
  }
}

export const getAddressType = (address: string) => {
  if (address.startsWith('5')) {
    return 'substrate'
  }
  if (address.startsWith('1')) {
    return 'polkadot'
  }

  const regex = /^[CDFGHJ]/i
  if (regex.test(address)) {
    return 'kusama'
  }

  return ''
}
