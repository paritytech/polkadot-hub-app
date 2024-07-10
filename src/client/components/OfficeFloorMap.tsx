import React, { MouseEventHandler, useEffect, useState } from 'react'
import { Avatar, Button, LoaderSpinner, P } from '#client/components/ui'
import {
  OfficeArea,
  OfficeAreaDesk,
  OfficeRoom,
  VisitType,
} from '#shared/types'
import { cn } from '#client/utils'
import { useStore } from '@nanostores/react'
import * as stores from '#client/stores'
import { ImageWithPanZoom } from './ui/ImageWithPanZoom'
import { ROBOT_USER_ID } from '#client/constants'

export type ScheduledItemType = {
  id: string
  value: string
  type: string
  date: string
  extraInformation?: string
  description: string
  areaId?: string
  objectId?: string
  user?: any
  status: string
}

type PointComponentFunctionProps = (
  item: OfficeAreaDesk | OfficeRoom,
  isSelected: boolean,
  isAvailable: boolean,
  onClick: (id: string, kind: string) => MouseEventHandler<HTMLAnchorElement>
) => Element | JSX.Element

const pointCommonStyle =
  'border-2 -translate-y-1/2 -translate-x-1/2 hover:scale-105 transition-all delay-100'

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
        pointCommonStyle,
        ' w-fit',
        isSelected
          ? 'border-pink-600 bg-accents-pink'
          : 'bg-violet-300 border-violet-300',
        isAvailable
          ? 'hover:bg-cta-purple hover:border-cta-hover-purpleNoOpacity hover:text-white'
          : 'hover:scale-100 hover:bg-violet-300',
        'min-h-[32px] min-w-[32px]'
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
        isSelected
          ? 'border-pink-600 hover:text-white bg-accents-pink hover:bg-accents-pinkDark'
          : 'text-black bg-green-200 border-green-200 hover:bg-cta-jade hover:border-cta-hover-jadeNoOpacity hover:text-white',
        'sm:p-4',
        pointCommonStyle,
        'absolute whitespace-nowrap'
      )}
      onClick={onClick(item.id, VisitType.RoomReservation)}
    >
      <p className="font-bold">{item.name}</p>
    </Button>
  ),
}

type OfficeFloorMapProps = {
  area: OfficeArea
  mappablePoints?: Array<any>
  panZoom?: boolean
  officeVisits?: Record<string, Array<ScheduledItemType>>
  showUsers?: boolean
  selectedPointId: string | null
  clickablePoints?: string[]
  onToggle: (id: string, kind: string) => void
}

export const OfficeFloorMap: React.FC<OfficeFloorMapProps> = ({
  area,
  mappablePoints,
  panZoom = false,
  officeVisits,
  showUsers = false,
  selectedPointId,
  clickablePoints,
  onToggle,
}) => {
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const maprSrc = React.useMemo(() => {
    !panZoom && setIsMapLoaded(false)
    return area.map
  }, [area])
  const me = useStore(stores.me)
  const initialStartPosition = selectedPointId
    ? mappablePoints?.find(
        (point: ScheduledItemType) => point.id === selectedPointId
      )
    : null

  const onClick = React.useCallback(
    (id: string, kind: string) => (ev: React.MouseEvent<HTMLButtonElement>) => {
      ev.preventDefault()
      onToggle(id, kind)
    },
    [onToggle]
  )

  const mapObjects = (scale: number) =>
    !mappablePoints
      ? []
      : mappablePoints
          .filter((x) => x.position)
          .map((x) => {
            let isSelected = selectedPointId === x.id
            let isAvailable = false
            let user = null

            if (!!officeVisits && me && showUsers) {
              const bookedVisit: ScheduledItemType | undefined =
                officeVisits.visit?.find(
                  (v) => v.areaId === area.id && v.objectId === x.id
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

            const style = {
              left: `${x.position?.x}%`,
              top: `${x.position?.y}%`,
              transform: `scale(${1 / scale})`,
              transformOrigin: 'top left',
            }
            if (!!user && !!me) {
              const userLink =
                !user.id || user.id === ROBOT_USER_ID
                  ? ''
                  : `/profile/${user.id}`
              return (
                <a
                  href={userLink}
                  className={cn(
                    `absolute -translate-y-1/2 -translate-x-1/2`,
                    !userLink && 'hover:cursor-default',
                    isSelected &&
                      'animate-bounce -translate-y-1/2 -translate-x-1/2'
                  )}
                  style={style}
                  key={user.id + x.position.x + x.position.y}
                >
                  <Avatar
                    src={user?.avatar}
                    userId={user?.id}
                    size="medium"
                    className={cn(
                      '-translate-y-1/2 -translate-x-1/2 ',
                      'border-2 border-transparent scale-125',
                      `${
                        me?.id === user?.id
                          ? 'border-purple-500 rounded-full'
                          : isSelected
                          ? 'border-blue-500 rounded-full'
                          : ''
                      }`
                    )}
                  />
                </a>
              )
            }
            return (
              <div
                className={
                  'absolute border-2 border-transparent -translate-y-1/2 -translate-x-1/2'
                }
                style={style}
                key={x.kind + x.position.x + x.position.y}
              >
                {/* @ts-ignore */}
                {PointComponent[x.kind](x, isSelected, isAvailable, onClick)}
              </div>
            )
          })

  return (
    <div className="relative">
      <div className={cn(!!panZoom ? 'hidden' : 'block')}>
        {!isMapLoaded && <LoaderSpinner />}
        <img
          src={maprSrc}
          alt={`${area.name} floor plan`}
          className="opacity-80"
          onLoad={() => setIsMapLoaded(true)}
        />
        {isMapLoaded && mapObjects(1)}
      </div>
      <div
        className={cn(
          !!panZoom ? 'block' : 'hidden',
          'border border-gray-300 rounded-sm'
        )}
      >
        <ImageWithPanZoom
          src={area.map}
          alt={`${area.name} floor plan`}
          className="block w-full object-contain overflow-hidden rounded-sm"
          imageOverlayMappingFn={(scale: number) => mapObjects(scale)}
          initialStartPosition={
            initialStartPosition ? initialStartPosition.position : undefined
          }
        />
      </div>
    </div>
  )
}
