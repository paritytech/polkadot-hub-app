import * as React from 'react'
import dayjs from 'dayjs'
import { Tag } from '#client/components/ui'
import { EventApplicationStatus } from '#shared/types'

export const statusLabel: Record<EventApplicationStatus, string> = {
  opened: 'Needs confirmation',
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled_admin: 'Rejected',
  cancelled_user: 'Opted Out',
}

export const getStatusBadge = (status: EventApplicationStatus) => {
  const label = statusLabel[status]
  switch (status) {
    case 'opened':
      return (
        <Tag color="yellow" size="small">
          {label}
        </Tag>
      )
    case 'confirmed':
      return (
        <Tag color="green" size="small">
          {label}
        </Tag>
      )
    case 'cancelled_admin':
      return (
        <Tag color="red" size="small">
          {label}
        </Tag>
      )
    case 'cancelled_user':
      return (
        <Tag color="gray" size="small">
          {label}
        </Tag>
      )
    default:
      return (
        <Tag color="gray" size="small">
          {status}
        </Tag>
      )
  }
}

export const paginateArray = (
  arr: Array<any>,
  page: number,
  pageSize: number
) => {
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  return arr.slice(startIndex, endIndex)
}
