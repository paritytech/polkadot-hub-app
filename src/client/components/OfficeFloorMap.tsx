import React from 'react'
import { Avatar, Button, P } from '#client/components/ui'
import {
  DailyEventType,
  OfficeArea,
  OfficeAreaDesk,
  OfficeRoom,
  User,
  UserMe,
  VisitType,
} from '#shared/types'
import { cn } from '#client/utils'
import { useStore } from '@nanostores/react'
import * as stores from '#client/stores'
import { ImageWithPanZoom } from './ui/ImageWithPanZoom'

type OfficeFloorMapProps = {
  area: OfficeArea
  mappablePoints?: any
  clickablePoints?: string[]
  selectedPointId: string | null
  onToggle: (id: string, kind: string) => void
  showUsers?: boolean
  officeVisits?: Record<string, Array<DailyEventType>>
  panZoom?: boolean
}

const PointComponent: Record<
  VisitType,
  (
    item: OfficeAreaDesk,
    isSelected: boolean,
    isAvailable: boolean,
    onClick: (id: string, kind: string) => void
  ) => Element | JSX.Element
> = {
  [VisitType.Visit]: (
    item: OfficeAreaDesk,
    isSelected: boolean,
    isAvailable: boolean,
    onClick: (id: string, kind: string) => void
  ) => (
    <Button
      size="small"
      kind={isSelected ? 'primary' : 'secondary'}
      disabled={!isAvailable}
      color={isSelected ? 'purple' : 'default'}
      className={cn(
        'absolute -translate-y-2/4 -translate-x-2/4 whitespace-nowrap',
        !isSelected && 'bg-gray-100',
        'rounded-sm',
        'hover:scale-105 transition-all delay-100'
      )}
      onClick={onClick(item.id, VisitType.Visit)}
    >
      {item?.name}
    </Button>
  ),
  [VisitType.RoomReservation]: (
    item: any,
    isSelected: boolean,
    isAvailable: boolean,
    onClick: (id: string, kind: string) => void
  ) => (
    <Button
      size="small"
      kind={isSelected ? 'primary' : 'secondary'}
      disabled={!isAvailable}
      className={cn(
        'absolute -translate-y-2/4 -translate-x-2/4 whitespace-nowrap',
        isSelected && 'border-pink-600 border-2',
        'bg-gray-100 text-black',
        'rounded-sm  border-2  p-4',
        'hover:scale-105 transition-all delay-100'
      )}
      onClick={onClick(item.id, VisitType.RoomReservation)}
    >
      <P textType="additional" className={cn('my-0')}>
        Meeting Room
      </P>
      <p className="font-bold">{item.name}</p>
    </Button>
  ),
  [VisitType.Guest]: (
    item: OfficeRoom,
    isSelected: boolean,
    isAvailable: boolean,
    onClick: (id: string, kind: string) => void
  ) => {},
}

const UserPoint = ({
  isMe,
  user,
  point,
}: {
  isMe: boolean
  user: User
  point: OfficeAreaDesk
}) => (
  <div
    className={cn(
      'absolute',
      `${isMe && 'border-4 border-purple-500 rounded-full'}`
    )}
    style={{
      left: `${point.position?.x - 2}%`,
      top: `${point.position?.y - 2.5}%`,
    }}
  >
    <a href={`/profile/${user.id}`}>
      <Avatar src={user?.avatar} userId={user?.id} size="medium" />
    </a>
  </div>
)

const PointMapping: React.FC<{
  me?: UserMe | null
  objects: Array<OfficeAreaDesk>
  areaId: string
  officeVisits?: Record<string, Array<DailyEventType>>
  showUsers: boolean
  selectedPointId: string | null
  clickablePoints?: string[]
  onToggle: (id: string, kind: string) => void
}> = ({
  me,
  objects,
  areaId,
  showUsers = false,
  officeVisits,
  selectedPointId,
  clickablePoints,
  onToggle,
}) => {
  const onClick = React.useCallback(
    (id: string, kind: string) => (ev: React.MouseEvent<HTMLButtonElement>) => {
      ev.preventDefault()
      onToggle(id, kind)
    },
    [onToggle]
  )

  return objects
    .filter((x) => x.position)
    .map((x) => {
      let isSelected = selectedPointId === x.id
      let isAvailable = false
      let user = null

      if (!!officeVisits && me && showUsers) {
        const bookedVisit: DailyEventType | undefined =
          officeVisits.visit?.find(
            (v) => v.areaId === areaId && v.objectId === x.id
          )
        if (!!bookedVisit) {
          if (bookedVisit?.user?.id === me?.id) {
            user = me
          } else {
            user = bookedVisit.user
          }
        }
      }
      isSelected = selectedPointId === x.id
      isAvailable = !!clickablePoints?.includes(x.id)
      return (
        <div key={x.id}>
          {!!user && !!me ? (
            <UserPoint isMe={me?.id === user?.id} user={user} point={x} />
          ) : (
            <div
              className={cn('absolute')}
              style={{
                left: `${x.position?.x}%`,
                top: `${x.position?.y}%`,
              }}
            >
              {/* // @todo fix this */}
              {PointComponent[x.kind](x, isSelected, isAvailable, onClick)}
            </div>
          )}
        </div>
      )
    })
}

export const OfficeFloorMap: React.FC<OfficeFloorMapProps> = ({
  area,
  mappablePoints,
  clickablePoints,
  selectedPointId,
  onToggle,
  showUsers = false,
  officeVisits,
  panZoom = false,
}) => {
  const me = useStore(stores.me)
  return (
    <div className="relative">
      <div className={cn(!!panZoom ? 'hidden' : 'block')}>
        <img
          src={area.map}
          alt={`${area.name} floor plan`}
          className="block w-full opacity-60"
        />
        <PointMapping
          me={me}
          objects={mappablePoints}
          areaId={area.id}
          showUsers={showUsers}
          officeVisits={officeVisits}
          selectedPointId={selectedPointId}
          clickablePoints={clickablePoints}
          onToggle={onToggle}
        />
      </div>
      <div
        className={cn(!!panZoom ? 'block' : 'hidden', 'border border-gray-300')}
      >
        <ImageWithPanZoom
          src={area.map}
          alt={`${area.name} floor plan`}
          className="block w-full opacity-60 object-contain overflow-hidden"
          initialScale={1.5}
          initialStartPosition={{ x: 30, y: 30 }}
          imageOverlayElement={
            <PointMapping
              me={me}
              objects={mappablePoints}
              areaId={area.id}
              showUsers={showUsers}
              officeVisits={officeVisits}
              selectedPointId={selectedPointId}
              clickablePoints={clickablePoints}
              onToggle={onToggle}
            />
          }
        />
      </div>
    </div>
  )
}
