import React, { useEffect, useState } from 'react'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import {
  FButton,
  HR,
  LoaderSpinner,
  P,
  showNotification,
} from '#client/components/ui'
import { PaymentItem } from '#shared/types'

export const StripePaymentForm: React.FC<{
  paymentRecord: PaymentItem
}> = ({ paymentRecord }) => {
  const stripe = useStripe()
  const elements = useElements()

  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!stripe) {
      return
    }

    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    )

    if (!clientSecret) {
      return
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case 'succeeded':
          showNotification('Payment succeeded!', 'success')
          break
        case 'processing':
          showNotification('Your payment is processing.', 'info')
          break
        case 'requires_payment_method':
          showNotification(
            'Your payment was not successful, please try again.',
            'error'
          )
          break
        default:
          showNotification('Something went wrong.', 'error')
          break
      }
    })
  }, [stripe])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return
    }

    setIsLoading(true)

    // @todo disable form fields when loading
    // Update a Payment Element after creation
    var paymentElement = elements.getElement('payment')
    paymentElement?.update({ readOnly: true })

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: `http://127.0.0.1:3000/payments/confirmation?id=${paymentRecord.id}`,
      },
    })

    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected to
    // your `return_url`. For some payment methods like iDEAL, your customer will
    // be redirected to an intermediate site first to authorize the payment, then
    // redirected to the `return_url`.
    if (error.type === 'card_error' || error.type === 'validation_error') {
      showNotification(error?.message, 'error')
    } else {
      showNotification('An unexpected error occurred.', 'error')
    }

    setIsLoading(false)
  }

  const paymentElementOptions = {
    layout: 'tabs',
  }

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement
        id="payment-element"
        options={paymentElementOptions}
        disabled={isLoading}
      />
      <HR className="my-5" />
      <div className="">
        <div className="flex justify-between">
          <P textType="additional">Total</P>
          <P textType="additionalBold">{paymentRecord?.amount} EUR</P>
        </div>
      </div>
      {isLoading ? (
        <LoaderSpinner />
      ) : (
        <FButton
          className="mt-4 w-full"
          size="small"
          kind="primary"
          disabled={isLoading || !stripe || !elements}
          id="submit"
          type="submit"
        >
          <span id="button-text">Pay</span>
        </FButton>
      )}
    </form>
  )
}
