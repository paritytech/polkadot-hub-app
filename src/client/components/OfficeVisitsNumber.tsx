import config from '#client/config'
import { DATE_FORMAT } from '#client/constants'
import { propEq } from '#shared/utils/fp'
import { useStore } from '@nanostores/react'
import dayjs, { Dayjs } from 'dayjs'
import * as React from 'react'
import * as stores from '#client/stores'
import { useOfficeVisitors } from '#modules/visits/client/queries'
import { Link } from './ui'
import { cn } from '#client/utils'

export const OfficeVisitsNumber = ({
  date,
  className,
}: {
  date: Dayjs
  className?: string
}) => {
  const me = useStore(stores.me)
  const officeId = useStore(stores.officeId)
  const currentOffice = config.offices.find((x) => x.id === officeId)?.name

  const { data: visitors, refetch: refetchVisitors } = useOfficeVisitors(
    officeId,
    dayjs(date).format(DATE_FORMAT)
  )

  const userIsInOffce = React.useMemo(
    () => me && visitors?.some(propEq('userId', me.id)),
    [visitors, me]
  )
  const visitorsNumber = React.useMemo(() => visitors?.length || 0, [visitors])
  return (
    <Link kind="secondary" href="" className={cn(className)}>
      <div className="text-text-tertiary">
        {userIsInOffce ? `You and ${visitorsNumber - 1}` : visitorsNumber}{' '}
        people in the {currentOffice} hub
      </div>
    </Link>
  )
}
