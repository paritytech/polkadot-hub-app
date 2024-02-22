import dayjs from 'dayjs'
import * as React from 'react'
import {
  FButton,
  P,
  RoundButton,
  Tag,
  WidgetWrapper,
} from '#client/components/ui'
import { PermissionsValidator } from '#client/components/PermissionsValidator'
import { GlobalEvent } from '#shared/types'
import { useGlobalEvents, useMetadata } from '../queries'
import Permissions from '#shared/permissions'
import { useStore } from '@nanostores/react'
import * as stores from '#client/stores'

const EventLink = ({ link, title }: { link: string; title: string }) => (
  <FButton
    href={link}
    kind="link"
    target="_blank"
    className="text-sm ml-[-8px] justify-self-start text-left"
  >
    {title}
  </FButton>
)

export const GlobalEvents: React.FC = () => (
  <PermissionsValidator required={[Permissions.events.ListGlobalEvents]}>
    <_GlobalEvents />
  </PermissionsValidator>
)

const _GlobalEvents: React.FC = () => {
  const permissions = useStore(stores.permissions)
  const [date, setDate] = React.useState(dayjs().startOf('month'))
  const currentYear = React.useMemo(() => date.year(), [date])
  const currentMonth = React.useMemo(() => date.month(), [date])

  const { data: events } = useGlobalEvents(currentYear, currentMonth)
  const { data: metadata } = useMetadata({
    // NOTE: prevent displaying internal links for externals
    enabled: permissions.has(Permissions.events.ListParticipants),
  })

  const onNavigate = React.useCallback(
    (direction: 1 | -1) => () => {
      setDate((date) => date.add(direction, 'month').startOf('month'))
    },
    []
  )

  return (
    <WidgetWrapper title={`Global Events ${date.format('YYYY')}`}>
      <div className="flex justify-between mb-6">
        <P className="text-base">{date.format('MMMM')}</P>

        <div className="flex gap-2">
          <RoundButton onClick={onNavigate(-1)} icon="ArrowBack" />
          <RoundButton onClick={onNavigate(1)} icon="ArrowForward" />
        </div>
      </div>
      {events?.length === 0 && (
        <P textType="additional" className="text-text-tertiary mb-0">
          No events have been added this month
        </P>
      )}
      {!!events?.length && (
        <div className="mt-4">
          {events.map((event: GlobalEvent) => (
            <div className="grid grid-cols-10" key={event.id}>
              <P
                textType="additional"
                className="text-text-secondary my-2 col-span-2"
              >{`${dayjs(event.startDate).format('DD')}  ${
                event.endDate && event.endDate !== event.startDate
                  ? `- ${dayjs(event.endDate).format('DD')} `
                  : ''
              }`}</P>
              <FButton
                className="text-sm col-span-5 sm:col-span-6 text-left"
                kind="link"
                href={`/events/${event.id}`}
              >
                {event.title}{' '}
                <span className="text-text-tertiary text-sm">
                  {event.location}
                </span>
              </FButton>
              {event.type && (
                <Tag
                  className="mt-2 col-span-3 sm:col-span-2 justify-self-end whitespace-nowrap"
                  size="small"
                  color={
                    metadata?.typeColorMap
                      ? metadata?.typeColorMap[event.type]
                      : 'gray'
                  }
                >
                  {event.type}
                </Tag>
              )}
            </div>
          ))}
        </div>
      )}
      {!!metadata &&
        'links' in metadata &&
        !!Object.keys(metadata.links ?? [])?.length && (
          <div>
            <hr className="my-6" />
            <P textType="additional" className="text-text-tertiary mb-1">
              Interested in participating?
            </P>
            <div className="grid grid-col-1 sm:grid-cols-2 justify-start">
              {metadata?.links?.map((link: { name: string; url: string }) => (
                <EventLink key={link.name} title={link.name} link={link.url} />
              ))}
            </div>
          </div>
        )}
    </WidgetWrapper>
  )
}
