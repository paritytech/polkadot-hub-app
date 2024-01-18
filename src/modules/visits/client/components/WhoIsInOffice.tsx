import { PermissionsValidator } from '#client/components/PermissionsValidator'
import {
  Avatar,
  FButton,
  P,
  RoundButton,
  WidgetWrapper,
} from '#client/components/ui'
import { StealthMode } from '#client/components/ui/StealthMode'
import config from '#client/config'
import { DATE_FORMAT } from '#client/constants'
import Permissions from '#shared/permissions'
import { propEq } from '#shared/utils/fp'
import { useStore } from '@nanostores/react'
import dayjs from 'dayjs'
import * as React from 'react'
import * as stores from '#client/stores'
import { useOfficeVisitors, useToggleStealthMode } from '../queries'
import { OfficeVisitor } from '#shared/types'
import { ROBOT_USER_ID } from '#server/constants'

export const WhoIsInOffice: React.FC = () => (
  <PermissionsValidator required={[Permissions.visits.ListVisitors]}>
    <_WhoIsInOffice />
  </PermissionsValidator>
)

const MAX_VISITORS_TO_SHOW = 24

const UserView = ({ user }: { user: OfficeVisitor }) => (
  <div className="flex mb-4">
    <Avatar
      size="medium"
      src={user.avatar}
      userId={user.userId}
      className="mr-2"
    />
    <div className="text-sm leading-tight">
      <div>{user.fullName}</div>
      <div className="text-gray-400">{user.areaName}</div>
    </div>
  </div>
)

export const _WhoIsInOffice = () => {
  const me = useStore(stores.me)
  const officeId = useStore(stores.officeId)
  const currentOffice = config.offices.find((x) => x.id === officeId)?.name
  const [dayOffset, setDayOffset] = React.useState<number>(0)
  const date = React.useMemo(
    () => dayjs().startOf('day').add(dayOffset, 'day'),
    [dayOffset]
  )

  const { data: visitors, refetch: refetchVisitors } = useOfficeVisitors(
    officeId,
    date.format(DATE_FORMAT)
  )
  const [showAll, setShowAll] = React.useState(false)
  const filteredVisitors = React.useMemo(
    () =>
      showAll ? visitors : (visitors || []).slice(0, MAX_VISITORS_TO_SHOW),
    [visitors, showAll]
  )

  const dateLabel = React.useMemo(() => {
    if (dayOffset === 0) {
      return 'Today'
    }
    if (dayOffset === 1) {
      return 'Tomorrow'
    }
    return dayjs(date).format('dddd')
  }, [dayOffset])

  const onChangeDayOffset = React.useCallback(
    (direction: -1 | 1) => (ev: React.MouseEvent) => {
      ev.preventDefault()
      setDayOffset((value) => {
        if (!value && direction === -1) return value
        return direction === -1 ? value - 1 : value + 1
      })
    },
    []
  )

  const { mutate: toggleStealthMode } = useToggleStealthMode(refetchVisitors)
  const onToggleStealthMode = React.useCallback((value: boolean) => {
    toggleStealthMode({ stealthMode: value })
  }, [])

  const userIsInOffce = React.useMemo(
    () => me && visitors?.some(propEq('userId', me.id)),
    [visitors, me]
  )
  const visitorsNumber = React.useMemo(() => visitors?.length || 0, [visitors])
  return (
    <WidgetWrapper title="Who's in the office?">
      <div className="flex items-center justify-between">
        <div>
          <P className="flex-1 mb-0">
            {!!dateLabel && <span>{dateLabel}, </span>}
            <span className="text-text-tertiary">
              {date.format('D MMMM')}
            </span>{' '}
            <br />
            <span className="text-text-tertiary">
              {userIsInOffce ? `You and ${visitorsNumber - 1}` : visitorsNumber}{' '}
              people in the {currentOffice} office
            </span>
          </P>
        </div>

        <div className="flex gap-2">
          <RoundButton onClick={onChangeDayOffset(-1)} icon={'ArrowBack'} />
          <RoundButton onClick={onChangeDayOffset(1)} icon={'ArrowForward'} />
        </div>
      </div>

      {!!filteredVisitors?.length && (
        <div className="sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 mt-8">
          {filteredVisitors.map((x) => {
            if (x.userId === ROBOT_USER_ID) {
              return <UserView user={x} />
            }
            return (
              <a
                href={`/profile/${x.userId}`}
                target="_blank"
                key={x.fullName}
                className="flex mb-4"
              >
                <UserView user={x} />
              </a>
            )
          })}
        </div>
      )}

      {!showAll && visitors && visitors?.length > MAX_VISITORS_TO_SHOW ? (
        <FButton kind="link" className="mt-4" onClick={() => setShowAll(true)}>
          Show more
        </FButton>
      ) : null}
      <StealthMode
        originalValue={me?.stealthMode || false}
        onToggle={onToggleStealthMode}
      />
    </WidgetWrapper>
  )
}
