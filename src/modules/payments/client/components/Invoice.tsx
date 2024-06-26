import config from '#client/config'
import { DATE_FORMAT } from '#client/constants'
import { useOffice } from '#client/utils/hooks'
import { useStore } from '@nanostores/react'
import dayjs from 'dayjs'
import React from 'react'
import * as stores from '#client/stores'
// import { PageTop, PageBottom, PageBreak } from '@fileforge/react-print'

export const Invoice = React.forwardRef((props, ref) => {
  const officeId = useStore(stores.officeId)
  const office = useOffice(officeId)
  const me = useStore(stores.me)
  return (
    <div ref={ref}>
      <div id="printableArea">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold">Invoice</h2>
        </div>

        <p>
          <strong>Invoice Date:</strong> {dayjs().format(DATE_FORMAT)}
        </p>
        <p>
          <strong>Due Date:</strong> {dayjs().format(DATE_FORMAT)}
        </p>

        <div className="flex justify-between mt-2">
          <div className="mb-6">
            <p className="font-bold">Supplier</p>
            <p>{config.companyName}</p>
            <p>{office?.address}</p>
            <p>
              {office?.city}, {office?.country}
            </p>
          </div>
          <div className="mb-6">
            <p className="font-bold">Customer</p>
            <p>{me?.fullName}</p>
            <p>{me?.email}</p>
          </div>
        </div>
        <div className="mb-6">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="p-2">Item Description</th>
                <th className="p-2">Quantity</th>
                <th className="p-2">Price</th>
                <th className="p-2">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2">
                  Membership:{' '}
                  {props.paymentRecord.purchasedProductReference.name}
                </td>
                <td className="p-2">1</td>
                <td className="p-2">
                  {props.paymentRecord.amount} {props.paymentRecord.currency}
                </td>
                <td className="p-2">
                  {' '}
                  {props.paymentRecord.amount} {props.paymentRecord.currency}
                </td>
              </tr>
              <tr>
                <td></td>
                <td></td>
                <td className="p-2 font-bold">Total:</td>
                <td className="p-2">
                  {props.paymentRecord.purchasedProductReference.amount.toFixed(
                    8
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
})
