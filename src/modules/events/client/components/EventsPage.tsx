import { useStore } from '@nanostores/react'
import * as React from 'react'
import { Header } from '#client/components/Header'
import {
  BackButton,
  Background,
  ComponentWrapper,
  H1,
  H2,
  HR,
} from '#client/components/ui'
import * as stores from '#client/stores'
import { useMyEvents, useUpcomingEvents } from '../queries'
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

const EventsList = ({
  events,
  title,
}: {
  title: string
  events: Array<Event>
}) => (
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
  const { data: events, isFetched } = useUpcomingEvents(officeId, 'time')
  const { data: myEvents, isFetched: isMineFetched } = useMyEvents(
    officeId,
    'status'
  )
  if (!isFetched && !isMineFetched) {
    return null
  }

  if (!events || !(Sections.past in events && Sections.upcoming in events)) {
    return (
      <div className="text-gray-400 text-center">No upcoming events yet</div>
    )
  }

  return (
    <Background>
      <Header />
      <ComponentWrapper>
        <BackButton />
        <H1 className="my-10 text-center">Events</H1>
        {!!myEvents && (
          <div>
            {Object.values(Sections).map((title) => {
              // @ts-ignore
              const evs = myEvents[TitleStatus[title] as EventApplicationStatus]
              if (!!evs?.length) {
                return <EventsList title={title} events={evs} />
              }
            })}
          </div>
        )}
        {[Sections.upcoming, Sections.past].map((timeTitle) => {
          const evs = events[timeTitle]
          if (evs?.length) {
            return <EventsList title={timeTitle} events={evs} />
          }
        })}
      </ComponentWrapper>
    </Background>
  )
}
