import React, { MouseEventHandler } from 'react'
import { Avatar, Button, P } from '#client/components/ui'
import {
  ScheduledItemType,
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

type PointComponentFunctionProps = (
  item: OfficeAreaDesk | OfficeRoom,
  isSelected: boolean,
  isAvailable: boolean,
  onClick: (id: string, kind: string) => MouseEventHandler<HTMLAnchorElement>
) => Element | JSX.Element

const PointComponent: Record<
  VisitType.Visit | VisitType.RoomReservation,
  PointComponentFunctionProps
> = {
  [VisitType.Visit]: (item, isSelected, isAvailable, onClick) => (
    <Button
      size="small"
      kind={isSelected ? 'primary' : 'secondary'}
      disabled={!isAvailable}
      color={isSelected ? 'purple' : 'default'}
      className={cn(
        'absolute -translate-y-2/4 -translate-x-2/4 whitespace-nowrap',
        !isSelected && 'bg-gray-100',
        isSelected && 'border-pink-600 border-2',
        'rounded-sm',
        'hover:scale-105 transition-all delay-100'
      )}
      onClick={onClick(item.id, VisitType.Visit)}
    >
      {item?.name}
    </Button>
  ),
  [VisitType.RoomReservation]: (item, isSelected, isAvailable, onClick) => (
    <Button
      size="small"
      kind={isSelected ? 'primary' : 'secondary'}
      disabled={!isAvailable}
      className={cn(
        'absolute -translate-y-2/4 -translate-x-2/4 whitespace-nowrap',
        isSelected && 'border-pink-600 border-2',
        'bg-gray-100 text-black',
        'rounded-sm  border-2  sm:p-4',
        'hover:scale-105 transition-all delay-100'
      )}
      onClick={onClick(item.id, VisitType.RoomReservation)}
    >
      <p className="font-bold">{item.name}</p>
    </Button>
  ),
}

const UserPoint = ({
  isMe,
  isSelected = false,
  user,
  point,
}: {
  isMe: boolean
  isSelected: boolean
  user: User
  point: OfficeAreaDesk
}) => (
  <div
    className={cn(
      'absolute -translate-y-2/4 -translate-x-2/4 whitespace-nowrap',
      `${isMe && 'border-2 border-purple-500 rounded-full'}`,
      `${!isMe && isSelected && 'border-4 border-blue-500 rounded-full'}`
    )}
    style={{
      left: `${point.position?.x}%`,
      top: `${point.position?.y}%`,
    }}
  >
    <a href={`/profile/${user.id}`}>
      <Avatar src={user?.avatar} userId={user?.id} size="medium" />
    </a>
  </div>
)

type PointMappingProps = {
  officeVisits?: Record<string, Array<ScheduledItemType>>
  showUsers?: boolean
  selectedPointId: string | null
  clickablePoints?: string[]
  onToggle: (id: string, kind: string) => void
}

const PointMapping: React.FC<
  PointMappingProps & {
    me?: UserMe | null
    objects: Array<
      OfficeAreaDesk & { kind: VisitType.Visit | VisitType.RoomReservation }
    >
    areaId: string
  }
> = ({
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
        const bookedVisit: ScheduledItemType | undefined =
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
            <UserPoint
              isMe={me?.id === user?.id}
              isSelected={isSelected}
              user={user}
              point={x}
            />
          ) : (
            <div
              className={cn('absolute')}
              style={{
                left: `${x.position?.x}%`,
                top: `${x.position?.y}%`,
              }}
            >
              {/* @ts-ignore */}
              {PointComponent[x.kind](x, isSelected, isAvailable, onClick)}
            </div>
          )}
        </div>
      )
    })
}

type OfficeFloorMapProps = {
  area: OfficeArea
  mappablePoints?: any
  panZoom?: boolean
} & PointMappingProps

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
  const initialStartingPosition = selectedPointId
    ? mappablePoints?.find(
        (point: ScheduledItemType) => point.id === selectedPointId
      )
    : null
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
          initialScale={1}
          initialStartPosition={
            initialStartingPosition
              ? {
                  x: initialStartingPosition.position.x,
                  y: initialStartingPosition.position.y,
                }
              : undefined
          }
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
