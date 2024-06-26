import {
  H1,
  H2,
  H3,
  Link,
  UserLabel,
  Tag,
  WidgetWrapper,
  BackButton,
} from '#client/components/ui'
// import { PageTop, PageBottom, PageBreak } from '@fileforge/react-print'
import { useStore } from '@nanostores/react'
import { useGetPayment } from '../queries'
import * as stores from '#client/stores'
import { useOffice } from '#client/utils/hooks'
import { PaymentProvider } from '#shared/types'
import { useMemo } from 'react'
import dayjs from 'dayjs'
import { FRIENDLY_DATE_FORMAT } from '#client/constants'
import { hasMembershipExpired } from '../helper'

export const AdminPaymentsDetail: React.FC<{}> = ({}) => {
  // only the owner or admin can see the invoice
  const page = useStore(stores.router)
  const me = useStore(stores.me)
  const officeId = useStore(stores.officeId)
  const office = useOffice(officeId)
  const { data: paymentRecord } = useGetPayment(page?.params.paymentId ?? '')
  const isPolkadot = useMemo(
    () => paymentRecord?.provider === PaymentProvider.Polkadot,
    [paymentRecord?.provider]
  )
  const isStripe = useMemo(
    () => paymentRecord?.provider === PaymentProvider.Stripe,
    [paymentRecord?.provider]
  )

  return (
    <WidgetWrapper className="h-auto">
      <BackButton />
      {!!paymentRecord && (
        <div>
          <H1>Payment </H1>
          <div className="flex flex-col gap-10">
            <div className="mt-4">
              <H2 className="mt-4">Payment details</H2>
              <table className="w-full">
                <tr>
                  <td className="w-1/5">Invoice</td>
                  <td>
                    <span className="uppercase">
                      {paymentRecord.id.split('-').reverse()[0]}
                    </span>
                  </td>
                </tr>
                {isStripe && (
                  <tr>
                    <td>Provider</td>
                    <td>{paymentRecord.provider}</td>
                  </tr>
                )}
                {isStripe && (
                  <tr>
                    <td>Provider invoice</td>
                    <td>
                      {' '}
                      <Link
                        target="_blank"
                        href={
                          paymentRecord.reference[
                            paymentRecord.reference.length - 1
                          ].data.object.receipt_url
                        }
                      >
                        Stripe invoice
                      </Link>
                    </td>
                  </tr>
                )}
                {isPolkadot && (
                  <tr>
                    <td>Provider</td>
                    <td> {paymentRecord.provider}</td>
                  </tr>
                )}
                {isPolkadot && (
                  <tr>
                    <td> Tx: </td>
                    <td>
                      <Link
                        target="_blank"
                        href={`https://westend.subscan.io/extrinsic/${paymentRecord.providerReferenceId}`}
                      >
                        Transaction on explorer
                      </Link>
                    </td>
                  </tr>
                )}
                <tr>
                  <td>Payee</td>
                  <td>
                    {' '}
                    <UserLabel user={paymentRecord.User} />
                  </td>
                </tr>
                <tr>
                  <td>Payment date</td>
                  <td>
                    {dayjs(paymentRecord.createdAt).format(
                      FRIENDLY_DATE_FORMAT
                    )}
                  </td>
                </tr>
                <tr>
                  <td>Paid</td>
                  <td>
                    {paymentRecord.amount} {paymentRecord.currency}
                  </td>
                </tr>
              </table>
            </div>
            <div className="mt-4">
              <H2> Membership details</H2>
              <table className="w-full">
                <tr>
                  <td className="w-1//5">Name</td>
                  <td>
                    {' '}
                    <div>
                      {`${paymentRecord.purchasedProductReference.name}  ${paymentRecord.purchasedProductReference.duration} ${paymentRecord.purchasedProductReference.type}`}
                      {hasMembershipExpired(
                        paymentRecord.createdAt,
                        paymentRecord.purchasedProductReference.type,
                        paymentRecord.purchasedProductReference.duration
                      ) ? (
                        <Tag color="red" size="small">
                          Expired
                        </Tag>
                      ) : (
                        <Tag color="green" size="small">
                          Active
                        </Tag>
                      )}
                    </div>
                  </td>
                </tr>

                <tr>
                  <td>Type</td>
                  <td>{paymentRecord.purchasedProductReference.type}</td>
                </tr>

                <tr>
                  <td>Length</td>
                  <td>{paymentRecord.purchasedProductReference.duration}</td>
                </tr>

                <tr>
                  <td>Location</td>
                  <td>{paymentRecord.purchasedProductReference.location}</td>
                </tr>

                <tr>
                  <td>Price</td>
                  <td>
                    {paymentRecord.purchasedProductReference.amount}{' '}
                    {paymentRecord.purchasedProductReference.currency}
                  </td>
                </tr>
                <tr>
                  <td>Location</td>
                  <td>{paymentRecord.purchasedProductReference.description}</td>
                </tr>
              </table>
            </div>
          </div>
        </div>
      )}
    </WidgetWrapper>
  )
}
