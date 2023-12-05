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
  const [noMoreData, setNoMoreData] = useState(false)
  const [page, setPage] = useState(1)
  const [eventData, setEventData] = useState<Array<EventPublicResponse>>([])

  useEffect(() => {
    if (events?.length && isFetched) {
      let limit = page === 1 ? pageSize : page * pageSize
      const result = paginateArray(events, 1, limit)
      setEventData(result)
      setNoMoreData(events.length <= limit)
    }
  }, [events, officeId, page])

  return events?.length && isFetched ? (
    <WidgetWrapper title="Upcoming Events">
      {!events?.length ? (
        <div className="text-gray-400 text-center">No upcoming events yet</div>
      ) : (
        <div className="-m-4">
          {eventData?.map((x, i) => (
            <div key={x.id}>
              <EventBadge
                event={x}
                withApplyButton={!x.applicationId && !x.metadata.global}
              />
              {i !== events.length - 1 && (
                <div className="px-4">
                  <HR key={x.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {!noMoreData && (
        <FButton
          kind="link"
          className="w-auto mt-6"
          onClick={() => setPage(page + 1)}
        >
          Show more
        </FButton>
      )}
    </WidgetWrapper>
  ) : null
}
