import { Select, Tag, WidgetWrapper } from '#client/components/ui'
import React from 'react'
import { useAvailableDesks, useVisitsAreas } from '../queries'
import { OfficeFloorMap } from '#client/components/OfficeFloorMap'
import { prop, propNotIn } from '#shared/utils/fp'

type Props = {
  officeId: string
  selectedDates: Array<string>
  selectedDeskId: string | null
  onSelectDesk: (desk: any) => void
  selectedAreaId: string | null
  onSelectArea?: (id: string) => void
}

export const DeskPicker: React.FC<Props> = ({
  officeId,
  selectedDates,
  selectedDeskId,
  onSelectDesk,
  selectedAreaId,
  onSelectArea,
}) => {
  const [deskId, setDeskId] = React.useState<string | null>(selectedDeskId)

  ///////// Area /////////
  const { data: areas = [] } = useVisitsAreas(officeId)
  const [areaId, setAreaId] = React.useState<string | null>(null)
  const area = React.useMemo(() => areas.find((x) => areaId === x.id), [areaId])
  const onAreaChange = React.useCallback(
    (areaId: string) => {
      setAreaId(areaId)
      setDeskId(null)
      onSelectDesk(null)
      onSelectArea && onSelectArea(areaId)
    },
    [areas]
  )

  React.useEffect(() => {
    setDeskId(selectedDeskId)
  }, [selectedDeskId])

  React.useEffect(() => {
    if (selectedAreaId) {
      setAreaId(selectedAreaId)
    }
  }, [selectedAreaId])

  React.useEffect(() => {
    if (areas.length) {
      setAreaId(areas[0].id)
      onSelectArea && onSelectArea(areas[0].id)
    }
  }, [areas])

  ///////// Available Area /////////
  const { data: availableDesks = [], isLoading: isAvailableDesksLoading } =
    useAvailableDesks(officeId, selectedDates)

  const availableAreaDeskIds = React.useMemo(() => {
    return availableDesks
      .filter((x) => x.areaId === area?.id)
      .map((x) => x.deskId)
  }, [availableDesks, area])

  React.useEffect(() => {
    if (
      deskId &&
      (!availableAreaDeskIds.includes(deskId) || !selectedDates.length)
    ) {
      setDeskId(null)
    }
  }, [availableAreaDeskIds, deskId, selectedDates])

  ///////// UnAvailable area /////////
  const [unavailableDeskNames, unavailableArea] = React.useMemo<
    [string[], boolean]
  >(() => {
    if (!area || !selectedDates.length || isAvailableDesksLoading)
      return [[], false]
    const areaNames = area.desks
      .filter(propNotIn('id', availableAreaDeskIds))
      .map(prop('name'))
    return [areaNames, area.desks.length === areaNames.length]
  }, [area, availableAreaDeskIds, selectedDates, isAvailableDesksLoading])

  const onToggleDesk = React.useCallback(
    (deskId: string) => {
      setDeskId((value) => (value === deskId ? null : deskId))
      onSelectDesk(deskId)
    },
    [area]
  )

  return (
    <WidgetWrapper>
      {unavailableDeskNames.length ? (
        <>
          <p className="mb-5">
            {unavailableArea ? (
              <span>
                ☝️ Area{' '}
                <Tag color="gray" size="small">
                  {area?.name}
                </Tag>{' '}
                is fully unavailable for reservation.
              </span>
            ) : (
              <span>
                ☝️ Desk{unavailableDeskNames.length !== 1 && 's'}{' '}
                {unavailableDeskNames.map((x, i) => (
                  <span key={x}>
                    {!!i && ', '}
                    <Tag color="gray" size="small">
                      {x}
                    </Tag>
                  </span>
                ))}{' '}
                {unavailableDeskNames.length !== 1 ? 'are' : 'is'} not available
                for booking.
              </span>
            )}
          </p>
          {/* <hr className="my-4" /> */}
        </>
      ) : null}
      {areas.length > 1 ? (
        <Select
          label="Area"
          options={areas.map((x) => ({
            label: x.name,
            value: x.id,
          }))}
          value={area?.id}
          onChange={onAreaChange}
          placeholder={'Select area'}
          className="w-full"
          containerClassName="mb-2"
        />
      ) : null}
      {area?.desks.length && (
        <Select
          label="Desk"
          options={(area?.desks || []).map((x) => ({
            label: x.name,
            value: x.id,
            disabled: !availableAreaDeskIds.includes(x.id),
          }))}
          value={deskId || undefined}
          onChange={onToggleDesk}
          placeholder={'Select desk'}
          className="w-full"
        />
      )}

      {!!area && (
        <div className="mt-4">
          <OfficeFloorMap
            area={area}
            availableDeskIds={availableAreaDeskIds}
            selectedDeskId={deskId}
            onToggleDesk={onToggleDesk}
          />
        </div>
      )}
    </WidgetWrapper>
  )
}
