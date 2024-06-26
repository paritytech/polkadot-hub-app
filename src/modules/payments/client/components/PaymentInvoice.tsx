import {
  BackButton,
  Background,
  ComponentWrapper,
  FButton,
  showNotification,
} from '#client/components/ui'
import { Header } from '#client/components/Header'
// import { PageTop, PageBottom, PageBreak } from '@fileforge/react-print'
import { useStore } from '@nanostores/react'
import { useGetPayment, useSendInvoice } from '../queries'
import config from '#client/config'
import dayjs from 'dayjs'
import { DATE_FORMAT } from '#client/constants'
import * as stores from '#client/stores'
import { useOffice } from '#client/utils/hooks'
import { PaymentProvider } from '#shared/types'

export const PaymentInvoice: React.FC<{}> = ({}) => {
  // only the owner or admin can see the invoice
  const page = useStore(stores.router)
  const me = useStore(stores.me)
  const officeId = useStore(stores.officeId)
  const office = useOffice(officeId)
  const { data: paymentRecord } = useGetPayment(page?.params.paymentId ?? '')
  const { mutate: sendInvoice } = useSendInvoice(() => {
    showNotification('Invoice sent', 'success')
  })

  const printContent = () => {
    const content = document.getElementById('printableArea').innerHTML
    const printWindow = window.open('', '_blank', 'height=600,width=800')
    if (!printWindow) {
      return
    }
    printWindow.document.write('<html><head><title>Print</title>')
    printWindow.document.write(`
    <style>
        @media print{
            body {
                font-family: 'Inter', sans-serif;
                print-color-adjust: exact; 
            }
        }

        @media print {
            table td tr {
                border-bottom: 1px solid #E5E7EB;
                print-color-adjust: exact; 
            }
        }
        #printHide {
            display: none;
        }
       
    </style>`)
    printWindow.document.write('</head><body >')
    printWindow.document.write(content)
    printWindow.document.write('</body></html>')
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <Background>
      <Header />
      <ComponentWrapper className="h-auto">
        <BackButton />

        {!!paymentRecord && (
          <div>
            <div className="flex gap-2  w-full flex-col  items-center sm:items-end mb-10 sm:mb-2">
              <FButton
                size="small"
                onClick={printContent}
                className="w-full sm:w-fit"
              >
                Print invoice
              </FButton>
              <FButton
                size="small"
                className="w-full sm:w-fit"
                onClick={() => {
                  if (!me?.email) {
                    window.confirm('You need to add email to your profile.')
                  } else
                    sendInvoice({
                      paymentId: paymentRecord.id,
                    })
                }}
              >
                Send invoice
              </FButton>
            </div>

            <div
              id="printableArea"
              style={{
                marginBottom: '32px',
              }}
            >
              <div
                style={{
                  marginBottom: '24px',
                }}
              >
                <h2
                  style={{
                    textAlign: 'center',
                    fontSize: '1.875rem',
                    fontWeight: '600',
                  }}
                >
                  Invoice
                </h2>
                <h3
                  style={{
                    fontSize: '1rem',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                  }}
                >
                  {' '}
                  #{paymentRecord.id.split('-').reverse()[0]}
                </h3>
              </div>

              <p>
                <strong>Due Date:</strong>{' '}
                {dayjs(paymentRecord.createdAt).format(DATE_FORMAT)}
              </p>

              <p>
                <strong>Paid Date:</strong>{' '}
                {dayjs(paymentRecord.createdAt).format(DATE_FORMAT)}
              </p>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '8px',
                }}
                className="flex flex-col sm:flex-row"
              >
                <div style={{ marginBottom: '24px' }}>
                  <p style={{ fontWeight: 'bold' }}>Supplier</p>
                  {config.invoiceInformation?.map((row) => (
                    <p>{row}</p>
                  ))}
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <p style={{ fontWeight: 'bold' }}>Customer</p>
                  <p>{me?.fullName}</p>
                  <p>{me?.email}</p>
                </div>
              </div>
              <div
                style={{ marginBottom: '24px' }}
                className="hidden sm:block"
                id="printShow"
              >
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        backgroundColor: '#E5E7EB',
                        textAlign: 'left',
                      }}
                    >
                      <th style={{ padding: '8px' }}>Item Description</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '8px' }}>
                        Membership:{' '}
                        {paymentRecord.purchasedProductReference.name}{' '}
                        {paymentRecord.purchasedProductReference.duration}{' '}
                        {paymentRecord.purchasedProductReference.type}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        {paymentRecord.amount} {paymentRecord.currency}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="sm:hidden" id="printHide">
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        backgroundColor: '#E5E7EB',
                        textAlign: 'left',
                      }}
                    >
                      <th style={{ padding: '8px' }}>Item Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '8px' }}>
                        Membership:{' '}
                        {paymentRecord.purchasedProductReference.name}{' '}
                        {paymentRecord.purchasedProductReference.duration}{' '}
                        {paymentRecord.purchasedProductReference.type}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        backgroundColor: '#E5E7EB',
                        textAlign: 'left',
                      }}
                    >
                      <th style={{ padding: '8px' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '8px' }}>
                        {paymentRecord.amount} {paymentRecord.currency}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {paymentRecord.provider === PaymentProvider.Polkadot && (
                <p
                  style={{
                    overflowWrap: 'break-word',
                    marginTop: '12px',
                    fontSize: '14px',
                  }}
                >
                  Transaction: {paymentRecord.providerReferenceId}
                </p>
              )}
              <p style={{ margin: '24px 0 8px 0' }}>
                We value your membership and are here to support you. Should you
                have any questions or need assistance, please contact our member
                services team.
              </p>
              <div style={{ fontSize: '12px', marginTop: '32px' }}>
                <p style={{ marginBottom: '4px' }}>Terms and conditions</p>{' '}
                <p>
                  This invoice reflects the full payment for your membership,
                  which is active immediately upon payment and will continue for
                  the period specified.
                </p>
                <p>
                  Membership benefits, terms, and conditions are subject to
                  change with prior notice to members as outlined in our
                  membership agreement.
                </p>
                <p>
                  Please review your membership benefits and terms carefully, as
                  all payments are final and non-refundable once processed
                </p>
              </div>
            </div>
          </div>
        )}
      </ComponentWrapper>
    </Background>
  )
}
