import { useStore } from '@nanostores/react'
import * as React from 'react'
import { BackButton, ComponentWrapper, H1, H2 } from '#client/components/ui'
import * as stores from '#client/stores'
import { useMyEventsView, useEventsView } from '../queries'
import { EventApplicationStatus } from '#shared/types'
import { EventBadge } from './EventBadge'
import { cn } from '#client/utils'

const Sections = {
  waiting: 'waiting for approval',
  confirmed: 'confirmed',
  past: 'past',
  rejected: 'rejected',
  optedOut: 'opted out',
  upcoming: 'upcoming',
}

import { EventTimeCategory, Event } from '#shared/types'

const TitleStatus = {
  [Sections.waiting]: EventApplicationStatus.Pending,
  [Sections.confirmed]: EventApplicationStatus.Confirmed,
  [Sections.rejected]: EventApplicationStatus.CancelledAdmin,
  [Sections.optedOut]: EventApplicationStatus.CancelledUser,
}
const EventsBg = {
  [Sections.waiting]: 'bg-yellow-50 border-yellow-100',
  [Sections.confirmed]: 'bg-green-50 border-green-100',
  [Sections.past]: 'bg-gray-100',
}

const EventsList = ({ events, title }: { title: string; events: Event[] }) => (
  <div>
    <H2 className="mt-10 mb-4 capitalize">{title}</H2>
    <div className="flex flex-col gap-2">
      {events?.map((x: any, i) => {
        if (title === Sections.upcoming && !!x.applications?.length) {
          return
        }
        return (
          <div key={x.id}>
            <EventBadge
              className={cn(
                'border border-gray-100 hover:scale-[102%] transition-all delay-50',
                EventsBg[title]
              )}
              event={x}
              withApplyButton={!x.applicationId && !x.metadata?.global}
              requiresAction={
                title === Sections.confirmed && !x.applicationComplete
              }
            />
          </div>
        )
      })}
    </div>
  </div>
)

export const EventsPage = () => {
  const officeId = useStore(stores.officeId)
  const { data: events, isFetched } = useEventsView(officeId, 'time')
  const { data: myEvents, isFetched: isMineFetched } = useMyEventsView(
    officeId,
    'status'
  )
  const [uniqueUpcoming, setUniqueUpcoming] = React.useState<Event[]>([])

  React.useEffect(() => {
    if (!!events && !!myEvents) {
      const upcomingEventIds = new Set(myEvents.pending.map((e) => e.id))
      const uniqueEvents = events[EventTimeCategory.upcoming].filter(
        (e) => !upcomingEventIds.has(e.id)
      )
      if (!!uniqueEvents.length) {
        setUniqueUpcoming(uniqueEvents)
      }
    }
  }, [myEvents, events])
  if (!isFetched && !isMineFetched) {
    return null
  }

  if (!events || !Object.keys(events).length) {
    return (
      <ComponentWrapper>
        <H1 className="my-10 text-center">Events</H1>
        <div className="text-gray-400 text-center">No events to show yet</div>
      </ComponentWrapper>
    )
  }

  return (
    <ComponentWrapper>
      <BackButton />
      <H1 className="my-10 text-center">Events</H1>
      {!!myEvents && (
        <div>
          {Object.values(Sections).map((title) => {
            // @ts-ignore
            const evs = myEvents[TitleStatus[title] as EventApplicationStatus]
            if (!!evs?.length) {
              return <EventsList key={title} title={title} events={evs} />
            }
          })}
        </div>
      )}
      {!!uniqueUpcoming?.length && (
        <EventsList
          key={Sections.upcoming}
          title={Sections.upcoming}
          events={uniqueUpcoming}
        />
      )}
      {!!events?.past && (
        <EventsList
          key={Sections.past}
          title={Sections.past}
          events={events[EventTimeCategory.past]}
        />
      )}
    </ComponentWrapper>
  )
}
