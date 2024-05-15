import React, { useEffect, useMemo, useState } from 'react'
import { LoaderSpinner } from '#client/components/ui'

import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { StripePaymentForm } from './StripePaymentForm'
import { useCreatePaymentIntent } from '../queries'
import { PaymentItem } from '#shared/types'
import { appearance } from '../helper'

// @todo add to env vars
const stripePromise = loadStripe(
  'pk_test_51P1Km1P4RQeZqTUKGTpLJq0Kwjr4ySnjjekez8qMHe5TCiMIRKe8CZQt1se1DBlCgdAtCY5AKswnNH4JVigYqJ1H00PD8UqibP'
)

export const StripePayment: React.FC<{
  paymentRecord: PaymentItem
}> = ({ paymentRecord }) => {
  const [clientSecret, setClientSecret] = useState('')

  const { mutate: createPaymentIntent, data: paymentIntentData } =
    useCreatePaymentIntent(() => {})

  useEffect(() => {
    if (!!paymentIntentData) {
      setClientSecret(paymentIntentData.data.clientSecret)
    }
  }, [paymentIntentData])

  useEffect(() => {
    if (!!paymentRecord) {
      const setup = async () => {
        if (paymentRecord.provider === 'stripe') {
          await createPaymentIntent({
            paymentRecordId: paymentRecord.id,
          })
        }
      }
      setup()
    }
  }, [])

  const options = {
    clientSecret,
    appearance,
  }

  return (
    <div className="my-10 flex gap-6">
      {!clientSecret && <LoaderSpinner />}
      {clientSecret && (
        <Elements options={options} stripe={stripePromise}>
          <StripePaymentForm paymentRecord={paymentRecord} />
        </Elements>
      )}
    </div>
  )
}
