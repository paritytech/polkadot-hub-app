import { FButton, HR, WidgetWrapper } from '#client/components/ui'
import * as stores from '#client/stores'
import { EventPublicResponse } from '#shared/types'
import { useStore } from '@nanostores/react'
import React, { useEffect, useState } from 'react'
import { EventBadge } from './EventBadge'
import { paginateArray } from '../helpers'
import { useUpcomingEvents } from '../queries'

const pageSize = 3

export const UpcomingEvents: React.FC = () => {
  const officeId = useStore(stores.officeId)
  const { data: events, isFetched } = useUpcomingEvents(officeId)
  const [page, setPage] = useState(1)
  const [eventData, setEventData] = useState<Array<EventPublicResponse>>([])

  useEffect(() => {
    if (!!events?.length && isFetched) {
      let limit = page === 1 ? pageSize : page * pageSize
      const result = paginateArray(events, 1, limit)
      setEventData(result)
    }
  }, [events, officeId, page])

  return (
    <WidgetWrapper title="Upcoming Events">
      <div className="flex flex-col justify-evenly h-full">
        {!events?.length ? (
          <div className="text-gray-400">No upcoming events at the moment</div>
        ) : (
          <div className="-m-4">
            {eventData.length &&
              eventData?.map((x, i) => (
                <div key={x.id}>
                  <EventBadge
                    event={x}
                    withApplyButton={!x.applicationId && !x.metadata.global}
                  />
                  {i !== eventData.length - 1 && (
                    <div className="px-4">
                      <HR key={x.id} />
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
        <div>
          <FButton
            kind="link"
            className="w-contain mb-6 -ml-2"
            onClick={() => stores.goTo('events')}
          >
            Show more
          </FButton>
        </div>
      </div>
    </WidgetWrapper>
  )
}
