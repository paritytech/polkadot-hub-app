import React from 'react'
import { Tag } from '#client/components/ui'
import { VisitStatus } from '#shared/types'
import { Size } from '#client/components/ui/Tag'

type Props = {
  status: VisitStatus
  size?: Size
}
export const VisitStatusTag: React.FC<Props> = ({ status, size = 'small' }) => {
  type Color = 'gray' | 'yellow' | 'green' | 'red' | 'blue'
  const label: Record<VisitStatus, string> = {
    confirmed: 'Confirmed',
    pending: 'Pending',
    cancelled: 'Cancelled',
  }
  const color: Record<VisitStatus, Color> = {
    confirmed: 'green',
    pending: 'yellow',
    cancelled: 'red',
  }
  return (
    <Tag color={color[status]} size={size}>
      {label[status]}
    </Tag>
  )
}
