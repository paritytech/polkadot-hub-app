import React, { useEffect, useState } from 'react'
import {
  Background,
  ComponentWrapper,
  H1,
  H2,
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

export const PaymentResultPage: React.FC<{}> = () => {
  const [paymentId, setPaymentId] = useState('')
  const { data: payment } = useGetPayment(paymentId)
  const office = useOffice(payment?.purchasedProductReference.location)

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

            <H2 className="text-center">
              We are delighted to have you on board.
            </H2>

            <div>
              {payment && (
                <div className="flex items-center flex-col">
                  <img
                    height={200}
                    width={200}
                    src={payment.purchasedProductReference.url}
                  ></img>{' '}
                  <LabelWrapper label="Access type">
                    {payment.purchasedProductReference.name}
                  </LabelWrapper>
                  <LabelWrapper label="Length of access">
                    {payment.purchasedProductReference.length}
                  </LabelWrapper>
                </div>
              )}
            </div>
            {office && (
              <div>
                <H3>Hub information</H3>
                <P>{office.name}</P>
                <P>{office.address}</P>
                <P>
                  {office.city}, {office.country}
                </P>
                <P>{office.directions}</P>
              </div>
            )}
            <div>
              <Link>Download your invoice</Link>
              <P></P>
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
