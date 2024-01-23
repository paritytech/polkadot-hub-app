import React from 'react'
import { Avatar, Button } from '#client/components/ui'
import { DailyEventType, OfficeArea, UserMe } from '#shared/types'
import { cn } from '#client/utils'
import { useStore } from '@nanostores/react'
import * as stores from '#client/stores'
import { ImageWithPanZoom } from './ui/ImageWithPanZoom'

type OfficeFloorMapProps = {
  area: OfficeArea
  availableDeskIds?: string[]
  selectedDeskId: string | null
  onToggleDesk: (deskId: string) => void
  showUsers?: boolean
  officeVisits?: Record<string, Array<DailyEventType>>
  panZoom?: boolean
}

const AreaMapping: React.FC<{
  me?: UserMe | null
  area: OfficeArea
  officeVisits?: Record<string, Array<DailyEventType>>
  showUsers: boolean
  selectedDeskId: string | null
  availableDeskIds?: string[]
  onToggleDesk: (id: string) => void
}> = ({
  me,
  area,
  showUsers = false,
  officeVisits,
  selectedDeskId,
  availableDeskIds,
  onToggleDesk,
}) => {
  const onClick = React.useCallback(
    (deskId: string) => (ev: React.MouseEvent<HTMLButtonElement>) => {
      ev.preventDefault()
      onToggleDesk(deskId)
    },
    [onToggleDesk]
  )
  return area.desks
    .filter((x) => x.position)
    .map((x) => {
      let isSelected = false
      let isAvailable = false
      let user = null

      if (showUsers && me) {
        if (!!officeVisits) {
          const bookedVisit: DailyEventType | undefined =
            officeVisits.visit?.find(
              (v) => v.areaId === area.id && v.deskId === x.id
            )
          if (!!bookedVisit) {
            if (bookedVisit?.user?.id === me?.id) {
              user = me
            } else {
              user = bookedVisit.user
            }
          }
        }
      } else {
        isSelected = selectedDeskId === x.id
        isAvailable = !!availableDeskIds?.includes(x.id)
      }
      return (
        <div key={x.id}>
          {!!user && !!me ? (
            <div
              className={cn(
                'absolute',
                `${
                  me?.id === user?.id &&
                  'border-4 border-purple-500 rounded-full'
                }`
              )}
              style={{
                left: `${x.position?.x - 2}%`,
                top: `${x.position?.y - 2.5}%`,
              }}
            >
              <a href={`/profile/${user.id}`}>
                <Avatar src={user?.avatar} userId={user?.id} size="medium" />
              </a>
            </div>
          ) : (
            <div
              className={cn('absolute', !showUsers && 'w-[1px] h-[1px]')}
              style={{
                left: `${x.position?.x}%`,
                top: `${x.position?.y}%`,
              }}
            >
              <Button
                size="small"
                kind={isSelected ? 'primary' : 'secondary'}
                disabled={!isAvailable && !showUsers}
                color={isSelected ? 'purple' : 'default'}
                className={cn(
                  '2xl:hidden absolute -translate-y-2/4 -translate-x-2/4 whitespace-nowrap',
                  !isSelected && 'bg-gray-100'
                )}
                onClick={onClick(x.id)}
              >
                {x.name}
              </Button>
              <Button
                kind={isSelected ? 'primary' : 'secondary'}
                disabled={!isAvailable && !showUsers}
                color={isSelected ? 'purple' : 'default'}
                className={cn(
                  'hidden 2xl:inline absolute -translate-y-2/4 -translate-x-2/4 whitespace-nowrap',
                  !isSelected && 'bg-gray-100'
                )}
                onClick={onClick(x.id)}
              >
                {x.name}
              </Button>
            </div>
          )}
        </div>
      )
    })
}

export const OfficeFloorMap: React.FC<OfficeFloorMapProps> = ({
  area,
  availableDeskIds,
  selectedDeskId,
  onToggleDesk,
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
        <AreaMapping
          me={me}
          area={area}
          showUsers={showUsers}
          officeVisits={officeVisits}
          selectedDeskId={selectedDeskId}
          availableDeskIds={availableDeskIds}
          onToggleDesk={onToggleDesk}
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
            <AreaMapping
              me={me}
              area={area}
              showUsers={showUsers}
              officeVisits={officeVisits}
              selectedDeskId={selectedDeskId}
              availableDeskIds={availableDeskIds}
              onToggleDesk={onToggleDesk}
            />
          }
        />
      </div>
    </div>
  )
}
