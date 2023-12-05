import React from 'react'
import { useStore } from '@nanostores/react'
import * as stores from '#client/stores'
import { WidgetWrapper } from '#client/components/ui'
import { useUncompletedActions } from '../queries'
import { cn } from '#client/utils'
import { EventBadge } from './EventBadge'

export const UncompletedActions: React.FC = () => {
  const officeId = useStore(stores.officeId)
  const { data: events = [], isFetched } = useUncompletedActions(officeId)

  return (events.length && isFetched) ? (
    <WidgetWrapper title="Uncompleted Actions">
      {!events?.length ? (
        <div className="text-gray-400 text-center">No upcoming events yet</div>
      ) : (
        <div>
          {events?.map((x, i) => (
            <div key={x.id}>
              <EventBadge
                event={x}
                className={cn('bg-accents-redTransparent', i !== 0 && 'mt-2')}
              />
            </div>
          ))}
        </div>
      )}
    </WidgetWrapper>
  ) : null
}
