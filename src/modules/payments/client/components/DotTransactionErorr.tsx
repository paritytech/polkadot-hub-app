import React, { useEffect, useState } from 'react'
import { ComponentWrapper, FButton, H1, Link, P } from '#client/components/ui'

import { PaymentStatus } from '#shared/types'
import { PaymentItem } from '#shared/types'
import { goTo } from '#client/stores'

export const DotTransactionError: React.FC<{ payment: PaymentItem }> = ({
  payment,
}) => {
  return (
    <ComponentWrapper>
      {payment && payment.status === PaymentStatus.Error && (
        <div>
          <H1 className="text-center">Whoops!</H1>
          <P>There has been an error while processing your transaction.</P>
          <P className="text-red-600">
            Error:{' '}
            {
              payment.reference[payment.reference.length - 1]?.result
                ?.dispatchError?.token
            }
          </P>
          <P>
            For more information please see{' '}
            <Link
              target="_blank"
              href={`https://polkadot.subscan.io/extrinsic/${payment.providerReferenceId}`}
            >
              transaction details
            </Link>
          </P>
          <div className="flex justify-center mt-10">
            <FButton onClick={() => goTo('paymentPage')}>Try again</FButton>
          </div>
        </div>
      )}
    </ComponentWrapper>
  )
}
