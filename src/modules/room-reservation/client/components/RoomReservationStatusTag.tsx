import { RoomReservationStatus } from '#shared/types'
import { Tag } from '#client/components/ui'
import { Size } from '#client/components/ui/Tag'

export const RoomReservationStatusTag: React.FC<{
  status: RoomReservationStatus
  size: Size
}> = ({ status, size = 'small' }) => {
  type Color = 'gray' | 'yellow' | 'green' | 'red' | 'blue'
  const label: Record<RoomReservationStatus, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
  }
  const color: Record<RoomReservationStatus, Color> = {
    pending: 'yellow',
    confirmed: 'green',
    cancelled: 'red',
  }
  return (
    <Tag color={color[status]} size={size}>
      {label[status]}
    </Tag>
  )
}
