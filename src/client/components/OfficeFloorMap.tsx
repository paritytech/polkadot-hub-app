import React from 'react'
import { Avatar, Button } from '#client/components/ui'
import { DailyEventType, OfficeArea } from '#shared/types'
import { cn } from '#client/utils'
import { useStore } from '@nanostores/react'
import * as stores from '#client/stores'

type OfficeFloorMapProps = {
  area: OfficeArea
  availableDeskIds?: string[]
  selectedDeskId: string | null
  onToggleDesk: (deskId: string) => void
  showUsers?: boolean
  officeVisits?: Record<string, Array<DailyEventType>>
}
export const OfficeFloorMap: React.FC<OfficeFloorMapProps> = ({
  area,
  availableDeskIds,
  selectedDeskId,
  onToggleDesk,
  showUsers = false,
  officeVisits,
}) => {
  const onClick = React.useCallback(
    (deskId: string) => (ev: React.MouseEvent<HTMLButtonElement>) => {
      ev.preventDefault()
      onToggleDesk(deskId)
    },
    [onToggleDesk]
  )
  const me = useStore(stores.me)
  return (
    <div className="relative">
      <img
        src={area.map}
        alt={`${area.name} floor plan`}
        className="block w-full opacity-60"
      />
      {area.desks
        .filter((x) => x.position)
        .map((x) => {
          let isSelected = false
          // currently a person can book many tables off the map.
          // TODO: update permissions with new roles
          let isAvailable = false
          let user = null

          if (showUsers) {
            if (!!officeVisits) {
              const bookedVisit: DailyEventType = officeVisits.visit?.find(
                (v) => v.areaId === area.id && v.deskId === x.id
              )
              if (bookedVisit) {
                if (bookedVisit?.user?.id === me?.id) {
                  user = me
                } else {
                  user = bookedVisit.user
                }
              }
            }
          } else {
            isSelected = selectedDeskId === x.id
            isAvailable = availableDeskIds?.includes(x.id)
          }
          return (
            <div key={x.id}>
              {!!user ? (
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
                    <Avatar
                      src={user?.avatar}
                      userId={user?.id}
                      size="medium"
                    />
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
        })}
    </div>
  )
}
