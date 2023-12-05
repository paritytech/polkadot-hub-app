import { Size } from '#client/components/ui/Tag'
import { GuestInvite } from '#shared/types'
import { Tag } from '#client/components/ui'

export const GuestInviteStatusTag: React.FC<{
    status: GuestInvite['status'], size?: Size
  }> = ({ status, size = 'small' }) => {
    type Color = 'gray' | 'yellow' | 'green' | 'red' | 'blue'
    const label: Record<GuestInvite['status'], string> = {
      pending: 'Pending',
      opened: 'Open',
      confirmed: 'Confirmed',
      rejected: 'Rejected',
      cancelled: 'Cancelled'
    }
    const color: Record<GuestInvite['status'], Color> = {
      pending: 'gray',
      opened: 'yellow',
      confirmed: 'green',
      rejected: 'red',
      cancelled: 'red'
    }
    return <Tag color={color[status]} size={size}>{label[status]}</Tag>
  }