import { WidgetWrapper } from '#client/components/ui'
import * as stores from '#client/stores'
import { cn } from '#client/utils'
import { useStore } from '@nanostores/react'
import React from 'react'
import { EventBadge } from './EventBadge'
import { useMyEvents } from '../queries'

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
              className={cn('bg-accents-greenTransparent', i !== 0 && 'mt-2')}
            />
          </div>
        ))}
      </div>
    </WidgetWrapper>
  ) : null
}
