import {
  FButton,
  HR,
  PlaceholderCard,
  WidgetWrapper,
} from '#client/components/ui'
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

  const title = !events?.length ? 'No Upcoming Events' : 'Upcoming Events'
  return (
    <WidgetWrapper title={title}>
      <div className="flex flex-col items-start justify-between flex-grow">
        <div>
          {!events?.length ? (
            <div className="flex flex-col gap-4">
              <PlaceholderCard />
              <PlaceholderCard />
              <PlaceholderCard />
            </div>
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
        </div>
        <FButton
          kind="link"
          className="w-contain -ml-2 full-grow"
          onClick={() => stores.goTo('events')}
        >
          Show All
        </FButton>
      </div>
    </WidgetWrapper>
  )
}
