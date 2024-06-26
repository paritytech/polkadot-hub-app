import React, { useEffect, useState } from 'react'
import { LoaderSpinner, RadioGroup, WidgetWrapper } from '#client/components/ui'

import { StripePayment } from './StripePayment'
import { DotPayment } from './DotPayment'
import { useCreatePayment, useMembership } from '../queries'

enum PaymentType {
  Stripe = 'stripe',
  Dot = 'dot',
}

export const PaymentWidget: React.FC<{
  membershipId: string
}> = ({ membershipId }) => {
  const [type, setType] = useState<string>(PaymentType.Stripe)
  const [txStatus, setTxStatus] = useState(false)
  const { data: paymentRecord, mutate: createPaymentRecord } =
    useCreatePayment()
  const { data: membership } = useMembership(membershipId)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!!paymentRecord) {
      setLoading(false)
    }
  }, [paymentRecord])
  useEffect(() => {
    setLoading(true)
    createPaymentRecord({
      amount: membership.amount,
      provider: type,
      purchasedProductReference: membership,
    })
  }, [type])

  if (!paymentRecord) {
    return <LoaderSpinner />
  }
  return (
    <WidgetWrapper title="Payment">
      {!txStatus && (
        <RadioGroup
          name="type"
          containerClassName="flex gap-6"
          onChange={(value) => setType(value)}
          value={type}
          options={[
            { value: PaymentType.Stripe, label: 'Credit card' },
            { value: PaymentType.Dot, label: 'DOT (-20%)' },
          ]}
          required={true}
        />
      )}
      {loading && <LoaderSpinner />}
      {!loading && type === PaymentType.Stripe && (
        <StripePayment
          paymentRecord={paymentRecord?.data}
          onTxStatusChange={setTxStatus}
        />
      )}
      {!loading && type === PaymentType.Dot && (
        <DotPayment
          paymentRecord={paymentRecord?.data}
          onTxStatusChange={setTxStatus}
        />
      )}
    </WidgetWrapper>
  )
}
