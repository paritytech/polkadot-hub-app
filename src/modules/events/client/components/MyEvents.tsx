import { WidgetWrapper } from '#client/components/ui'
import * as stores from '#client/stores'
import { cn } from '#client/utils'
import { useStore } from '@nanostores/react'
import React from 'react'
import { EventBadge } from './EventBadge'
import { useMyEvents } from '../queries'
import { EventApplicationStatus } from '#shared/types'

const ApplicationBg: Record<EventApplicationStatus, string> = {
  [EventApplicationStatus.Pending]: 'bg-yellow-50 border-yellow-100',
  [EventApplicationStatus.Opened]: 'bg-yellow-50 border-yellow-100',
  [EventApplicationStatus.Confirmed]: 'bg-green-50 border-green-100',
  [EventApplicationStatus.CancelledAdmin]: 'bg-gray-100',
  [EventApplicationStatus.CancelledUser]: 'bg-gray-100',
}

export const MyEvents: React.FC = () => {
  const officeId = useStore(stores.officeId)
  const { data: events = [], isFetched } = useMyEvents(officeId)

  return events.length && isFetched ? (
    <WidgetWrapper title={'Your Events'}>
      <div className="-mx-4 -mb-4">
        {events?.map((x, i) => (
          <div key={x.id}>
            <EventBadge
              event={x}
              className={cn(
                ApplicationBg[x.status as EventApplicationStatus],
                i !== 0 && 'mt-2'
              )}
            />
          </div>
        ))}
      </div>
    </WidgetWrapper>
  ) : null
}
