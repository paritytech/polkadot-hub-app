import React, { useEffect, useState } from 'react'
import {
  Background,
  ComponentWrapper,
  FButton,
  H1,
  H3,
  LabelWrapper,
  Link,
  LoaderSpinner,
  P,
} from '#client/components/ui'

import { Header } from '#client/components/Header'
import { useGetPayment } from '../queries'
import { PaymentStatus } from '#shared/types'
import { DotTransactionError } from './DotTransactionErorr'
import { useOffice } from '#client/utils/hooks'
import { useStore } from '@nanostores/react'
import * as stores from '#client/stores'
import { FRIENDLY_DATE_FORMAT } from '#client/constants'
import dayjs from 'dayjs'

export const PaymentResultPage: React.FC<{}> = () => {
  const [paymentId, setPaymentId] = useState('')
  const { data: payment } = useGetPayment(paymentId)
  const office = useOffice(payment?.purchasedProductReference?.location ?? '')
  console.log(office)
  const me = useStore(stores.me)

  useEffect(() => {
    const url = new URL(document.location.href)
    const paymentIdQ = url.searchParams.get('id')
    if (!!paymentIdQ) {
      setPaymentId(paymentIdQ)
    }
  }, [])

  if (!payment) {
    return <LoaderSpinner />
  }

  return (
    <Background className={''}>
      <Header />
      <ComponentWrapper>
        {payment && payment.status === PaymentStatus.Success && (
          <div>
            <H1 className="text-center">Welcome!</H1>

            <P className="text-left mb-10">
              We are delighted to have you on board. Here is some information to
              get you started.
            </P>

            <div className="flex flex-col gap-10">
              <div>
                <H3 className="text-center">Your Membership NFT</H3>
                <img
                  className="m-auto"
                  height={200}
                  width={200}
                  src={payment.purchasedProductReference.url}
                ></img>{' '}
                <LabelWrapper label="Receiving address">XXXXX</LabelWrapper>
                <P>
                  Please allow a few moments for your NFT to be minted and sent
                  to the specified address.
                </P>
                <P>
                  Membership NFT allows you physical access to the{' '}
                  {payment.purchasedProductReference.location} hub. Make sure to
                  have your wallet handy when you come visit us.
                </P>
              </div>
              <div>
                <H3>Membership details</H3>
                {payment && (
                  <div>
                    <LabelWrapper label="Type">
                      {payment.purchasedProductReference.name}{' '}
                      {payment.purchasedProductReference.duration}{' '}
                      {payment.purchasedProductReference.type}
                    </LabelWrapper>
                    <LabelWrapper label="Description">
                      {payment.purchasedProductReference.description}
                    </LabelWrapper>
                    <LabelWrapper label="Invoice">
                      <Link href={`/payments/invoice/${payment.id}`}>
                        Get your invoice
                      </Link>
                    </LabelWrapper>
                    <LabelWrapper label="Active from">
                      {dayjs(payment.createdAt).format(FRIENDLY_DATE_FORMAT)}
                    </LabelWrapper>
                    <LabelWrapper label="Expiration">
                      {dayjs(payment.createdAt)
                        .add(
                          payment.purchasedProductReference.duration,
                          payment.purchasedProductReference.type
                        )
                        .format(FRIENDLY_DATE_FORMAT)}
                    </LabelWrapper>
                  </div>
                )}
              </div>
              {office && (
                <div>
                  <H3>Hub information</H3>
                  <LabelWrapper label="Hub Name">{office.name}</LabelWrapper>
                  <LabelWrapper label="Address">
                    {office.address} {office.city}, {office.country}
                  </LabelWrapper>

                  <LabelWrapper label="Directions">
                    {office.directions}
                  </LabelWrapper>

                  <LabelWrapper label="Contact">
                    {office?.supportContact}
                  </LabelWrapper>
                </div>
              )}
              <P>
                Please do not hesitate to contact us in case of any questions or
                issues.
              </P>
            </div>
            <div className="w-full flex justify-center">
              <FButton className="mt-10 mb-10" href="/">
                Continue to Hub
              </FButton>
            </div>
          </div>
        )}

        {payment && payment.status === PaymentStatus.Error && (
          <DotTransactionError payment={payment} />
        )}
      </ComponentWrapper>
    </Background>
  )
}
