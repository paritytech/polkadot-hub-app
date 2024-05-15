import React, { useEffect, useState } from 'react'
import {
  Background,
  ComponentWrapper,
  H1,
  Link,
  P,
} from '#client/components/ui'

import { Header } from '#client/components/Header'
import { PaymentWidget } from './PaymentWidget'
import { useGetPayment } from '../queries'
import { PaymentStatus } from '#shared/types'
import { PaymentItem } from '#shared/types'

export const DotTransactionError: React.FC<{ payment: PaymentItem }> = ({
  payment,
}) => {
  return (
    <ComponentWrapper>
      {payment && payment.status === PaymentStatus.Error && (
        <div>
          <H1 className="text-center">Whoops!</H1>
          <P>There has been an error while processing your transaction.</P>
          <P>
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
              href={`https://westend.subscan.io/extrinsic/${payment.providerReferenceId}`}
            >
              transaction details
            </Link>
          </P>
        </div>
      )}
    </ComponentWrapper>
  )
}
