import React from 'react'
import { Button } from '#client/components/ui'
import { OfficeArea } from '#shared/types'
import { cn } from '#client/utils'

type OfficeFloorMapProps = {
  area: OfficeArea
  availableDeskIds: string[]
  selectedDeskId: string | null
  onToggleDesk: (deskId: string) => void
}
export const OfficeFloorMap: React.FC<OfficeFloorMapProps> = ({
  area,
  availableDeskIds,
  selectedDeskId,
  onToggleDesk,
}) => {
  const onClick = React.useCallback(
    (deskId: string) => (ev: React.MouseEvent<HTMLButtonElement>) => {
      ev.preventDefault()
      onToggleDesk(deskId)
    },
    [onToggleDesk]
  )
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
          const isSelected = selectedDeskId === x.id
          const isAvailable = availableDeskIds.includes(x.id)
          return (
            <div
              key={x.id}
              className="absolute w-[1px] h-[1px]"
              style={{ left: `${x.position?.x}%`, top: `${x.position?.y}%` }}
            >
              <Button
                size="small"
                kind={isSelected ? 'primary' : 'secondary'}
                disabled={!isAvailable}
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
                disabled={!isAvailable}
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
          )
        })}
    </div>
  )
}
