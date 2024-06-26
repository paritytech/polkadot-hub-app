import React, { useEffect, useMemo, useState } from 'react'
import {
  FButton,
  HR,
  LabelWrapper,
  Link,
  LoadingPolkadot,
  LoadingPolkadotWithText,
  P,
  Select,
} from '#client/components/ui'

import { Decimal } from 'decimal.js'

import { BaseWallet, WalletType } from '@polkadot-onboard/core'
import { makePaymentTransaction } from '#client/utils/polkadot'
import { extensionConfig } from '#client/utils/config'
import {
  ExtensionAccount,
  GENERIC_ERROR,
  getAccountsByType,
  getWallets,
  isWalletConnect,
} from '#client/utils/polkadot-onboard'
import { useCurrencyPrice, useUpdatePayment } from '../queries'
import { PaymentStatus, PaymentSteps } from '#shared/types'
import dayjs from 'dayjs'
import { useStore } from '@nanostores/react'
import * as stores from '#client/stores'
import { useOffice } from '#client/utils/hooks'
import config from '#client/config'
import { getDiscountValue } from '../helper'

export const DotPayment: React.FC<{
  paymentRecord: any
  onTxStatusChange: (status: string) => void
}> = ({ paymentRecord, onTxStatusChange }) => {
  const [loading, setLoading] = useState(false)
  const [txId, setTxId] = useState<string>('')

  const officeId = useStore(stores.officeId)
  const office = useOffice(officeId)

  const [wallets, setWallets] = useState<BaseWallet[]>([])
  const [selectedAddress, setSelectedAddress] = useState<string>()
  const [chosenWallet, setChosenWallet] = useState<BaseWallet>()
  const [accounts, setAccounts] = useState<ExtensionAccount[]>([])

  const [error, setError] = useState<JSX.Element | string>()
  const [step, setStep] = useState<PaymentSteps | ''>()
  const [loaderText, setLoaderText] = useState<string>('')

  const { mutate: updatePayment, data: updatedRecord } = useUpdatePayment()
  const { data: fiatPerDot } = useCurrencyPrice()

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.address === selectedAddress),
    [selectedAddress]
  )
  // @todo recalculated DOT price every few seconds
  const priceInDot = React.useMemo(
    () =>
      fiatPerDot
        ? new Decimal(paymentRecord.amount)
            .div(new Decimal(fiatPerDot * 10))
            .toString()
        : 0,
    [paymentRecord, fiatPerDot]
  )

  const discountValue = React.useMemo(
    () => (!!config.dotDiscount ? getDiscountValue(priceInDot.toString()) : 0),
    [priceInDot]
  )

  const total = React.useMemo(() => {
    if (!config.dotDiscount) {
      return priceInDot
    }
    return !!priceInDot
      ? new Decimal(priceInDot).sub(new Decimal(discountValue)).toString()
      : 0
  }, [discountValue, priceInDot])

  const txInProgress = React.useMemo(
    () => step == PaymentSteps.TransactionInProgress,
    [step]
  )

  const txFinalized = React.useMemo(
    () => step == PaymentSteps.TransactionFinalized,
    [step]
  )

  const onlyWalletConnect = React.useMemo(
    () => wallets.length === 1 && isWalletConnect(wallets[0]),
    [wallets]
  )

  const walletLabels = React.useMemo(
    () =>
      wallets.map((wallet: BaseWallet) => {
        const isWC = isWalletConnect(wallet)
        return {
          label: isWC ? 'Wallet Connect' : wallet.metadata.title,
          value: isWC ? 'wallet-connect' : wallet.metadata.id,
        }
      }),
    [wallets]
  )

  const accountLabels = React.useMemo(
    () =>
      accounts.map((account) => {
        return {
          label: `${account.name}  ${
            account.addressType ? `- ${account.addressType}` : ''
          } (${account.source})`,
          value: account.address,
        }
      }),
    [accounts]
  )

  useEffect(() => {
    const disconnectAndRedirect = async () => {
      try {
        await chosenWallet?.disconnect()
      } catch (e) {
        console.log(e)
      }
      const url = new URL('http://127.0.0.1:3000/payments/confirmation')
      url.searchParams.set('id', paymentRecord.id)
      window.location.href = url.toString()
    }

    if (!!txId && !!updatedRecord) {
      disconnectAndRedirect()
    }
  }, [txId, updatedRecord])

  useEffect(() => {
    const init = async () => {
      const walletsData = await getWallets()
      setWallets(walletsData)
      if (!walletsData.length) {
        setError('Please contact administrator')
        setStep(PaymentSteps.Error)
        return
      }
    }
    init()
  }, [])

  const makeDotPayment = async (cb: () => void) => {
    try {
      if (!selectedAccount) {
        console.error('Invalid account.')
        return
      }
      return makePaymentTransaction(
        selectedAddress,
        chosenWallet?.signer,
        total,
        cb
      )
    } catch (e: any) {
      if (e?.message === 'Cancelled') {
        console.error('The user cancelled signing process')
        setLoading(false)
        setLoaderText('')
        setStep('')
        setChosenWallet(undefined)
        setSelectedAddress(undefined)
      } else {
        console.error('Payment error')
        setLoading(false)
        setLoaderText('')
        setError(e?.message)
      }
    }
  }

  const getStep = (currentStep: PaymentSteps) => {
    switch (currentStep) {
      case PaymentSteps.TransactionInProgress:
        return (
          <div>
            {loaderText && <LoadingPolkadotWithText text={loaderText} />}
          </div>
        )
      case PaymentSteps.TransactionFinalized:
        const url = new URL(`${config.appHost}/payments/confirmation`)
        url.searchParams.set('id', paymentRecord.id)
        window.location.href = url.toString()
        break
        // return (
        // <div>
        {
          /* {!!txId && (
              <div className="mt-4">
                <LabelWrapper label="Status">
                  <Tag color="green">Success</Tag>
                </LabelWrapper>
                <LabelWrapper label="Transaction id" className="mt-2">
                  ...{txId.slice(txId.length - 16, txId.length)}{' '}
                  <CopyToClipboard text={txId} />
                </LabelWrapper>
                <LabelWrapper label="Explorer link" className="mt-2">
                  <FButton
                    href={`https://westend.subscan.io/extrinsic/${txId}`}
                    kind="link"
                    target="_blank"
                  >
                    See on Explorer
                  </FButton>
                </LabelWrapper>
                <LabelWrapper label="Receipt" className="mt-2">
                  <FButton
                    href={`https://westend.subscan.io/extrinsic/${txId}`}
                    kind="link"
                    target="_blank"
                  >
                    Download
                  </FButton>
                </LabelWrapper>
              </div>
            )} */
        }
      case PaymentSteps.Error:
        return setError(GENERIC_ERROR)
      default:
        break
    }
  }

  return (
    <div className="my-2 flex flex-col gap-2">
      {!txInProgress && !txFinalized && (
        <div className="mt-6 flex gap-2 flex-col">
          <div className="flex gap-2">
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
            <a
              href={
                'https://docs.novawallet.io/nova-wallet-wiki/dapps/using-walletconnect-for-dapps'
              }
            >
              <img
                height="24"
                width="24"
                src={'/novawallet-icon.svg'}
                className="hover:scale-110"
              ></img>
            </a>
            <a href={''}>
              <img
                height="24"
                width="24"
                src={'/wallet-connect-icon.svg'}
                className="hover:scale-110"
              ></img>
            </a>
          </div>
          <div>
            <Link href="/how-to-pay-with-dot" className="mt-6" target="_blank">
              How to Pay with DOT
            </Link>
          </div>
        </div>
      )}
      {!txInProgress && !txFinalized && (
        <div className="flex flex-col w-full md:w-1/2 mt-4">
          <LabelWrapper label="wallet" className="sm:flex-col sm:gap-1">
            <Select
              placeholder="select wallet"
              containerClassName="w-full mb-4"
              value={chosenWallet?.metadata.title}
              onChange={async (v) => {
                try {
                  const wallet = wallets.find(
                    (w: BaseWallet) => w.metadata.id === v
                  )
                  setChosenWallet(wallet)
                  !!wallet &&
                    wallet
                      .connect()
                      .then(() => {
                        return getAccountsByType[
                          wallet.type as
                            | WalletType.INJECTED
                            | WalletType.WALLET_CONNECT
                        ](wallet)
                      })
                      .then((accounts) => {
                        setAccounts(accounts)
                      })
                } catch (e) {
                  console.error(e)
                  setError(<p>{GENERIC_ERROR}</p>)
                }
              }}
              options={walletLabels}
            ></Select>
          </LabelWrapper>

          <LabelWrapper label="address" className="sm:flex-col sm:gap-1">
            <Select
              placeholder="select address"
              containerClassName="w-full mb-4"
              value={selectedAddress}
              disabled={!accounts.length}
              onChange={(v) => {
                setSelectedAddress(v)
                setStep(PaymentSteps.SignTransaction)
              }}
              options={accountLabels}
            ></Select>
          </LabelWrapper>

          <HR className="my-5" />
          <div className="">
            <div className="flex justify-between">
              <P textType="additional" className="mb-0">
                Subtotal
              </P>
              <div>
                <P textType="additional" className="mb-0">
                  {priceInDot && priceInDot} DOT
                </P>
                <P textType="detail" className="text- text-"></P>
              </div>
            </div>
            {!!config.dotDiscount && discountValue && (
              <div className="flex justify-between">
                <P textType="additional" className="text-accents-pink mb-0">
                  Discount
                </P>
                <P textType="additional" className="text-accents-pink mb-0">
                  -{config.dotDiscount}% (-{discountValue} DOT)
                </P>
              </div>
            )}
            <div className="flex justify-between">
              <P textType="additional">Total</P>
              <P textType="additionalBold">{total} DOT</P>
            </div>

            <P textType="detail">
              All sales are charged in DOT and all sales are final. The current
              {paymentRecord.currency} to DOT conversion rate is taken from{' '}
              <Link href="https://www.coingecko.com/en/coins/polkadot">
                Coingecko
              </Link>{' '}
              as of the moment of the sale.
            </P>
          </div>

          <FButton
            className="w-full"
            kind="primary"
            size="small"
            onClick={async () => {
              if (selectedAccount) {
                try {
                  setStep(PaymentSteps.TransactionInProgress)
                  setLoaderText('Transaction is being prepared')
                  onTxStatusChange('in_progress')
                  await makeDotPayment((result) => {
                    if (result.status.isInBlock) {
                      setLoaderText(
                        `Transaction status: ${result.status.type}. Please allow up to 30 seconds to process.`
                      )
                    } else {
                      setLoaderText(`Transaction status: ${result.status.type}`)
                    }
                    console.log('result status', result.status)
                    console.log(
                      'result status final',
                      result.status.isFinalized
                    )
                    if (result?.status?.isFinalized) {
                      const human = result.toHuman()
                      const txHashHex = Array.from(result.txHash)
                        .map((byte) =>
                          ('0' + (byte & 0xff).toString(16)).slice(-2)
                        )
                        .join('')
                      const txHashWithPrefix = '0x' + txHashHex
                      setTxId(txHashWithPrefix)
                      console.log('tx hash ', txHashWithPrefix)
                      let transactionResult = PaymentStatus.Success
                      if (!!human.dispatchError) {
                        transactionResult = PaymentStatus.Error
                      }
                      console.log('will update')
                      updatePayment({
                        id: paymentRecord.id,
                        providerReferenceId: txHashWithPrefix,
                        reference: [
                          {
                            id: paymentRecord.id,
                            amount: priceInDot,
                            txId: txHashWithPrefix,
                            result: result,
                            created: dayjs().unix(),
                          },
                        ],
                        status: transactionResult,
                      })
                      onTxStatusChange('success')
                      setStep(PaymentSteps.TransactionFinalized)
                    }
                  })
                } catch (e) {
                  console.log(e)
                }
              }
            }}
            disabled={
              !selectedAccount || step === PaymentSteps.TransactionInProgress
            }
          >
            Sign Transaction
          </FButton>
        </div>
      )}

      {error && (
        <div>
          <P className="text-red-600">Error: {error}</P>
          <P>
            Please contact support in case you are experiencing any issues:{' '}
            {office.supportContact}
          </P>
          <div className="flex justify-center mt-10">
            <FButton
              onClick={() => {
                setChosenWallet(undefined)
                setSelectedAddress('')
                setError('')
                setStep('')
              }}
            >
              Try again
            </FButton>
          </div>
        </div>
      )}

      <div>{!loading && !!step && (getStep(step) as React.ReactNode)}</div>

      <div>{loading && <LoadingPolkadot />}</div>
    </div>
  )
}
