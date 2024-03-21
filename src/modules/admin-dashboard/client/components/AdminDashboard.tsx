import React from 'react'
import dayjs, { Dayjs } from 'dayjs'
import { formatDateRange } from '#client/utils'
import { renderComponent } from '#client/utils/portal'
import { H1, RoundButton, Select, WidgetWrapper } from '#client/components/ui'
import { RootComponentProps } from '#shared/types'

type Unit = 'week' | 'month' | 'year'

export const AdminDashboard: React.FC<RootComponentProps> = (props) => {
  const [offset, setOffset] = React.useState<number>(0)
  const [unit, setUnit] = React.useState<Unit>('year')

  const period = React.useMemo<[Dayjs, Dayjs]>(() => {
    const start = dayjs()
      .startOf(unit === 'week' ? 'isoWeek' : unit)
      .add(offset, unit)
    const end = start.endOf(unit === 'week' ? 'isoWeek' : unit)
    return [start, end]
  }, [offset, unit])

  const portalGroups = React.useMemo(() => {
    const result = []
    for (const portalId in props.portals) {
      result.push({
        id: portalId,
        components: props.portals[portalId],
      })
    }
    return result
  }, [props.portals])

  const onNavigate = React.useCallback(
    (direction: -1 | 1) => () => setOffset((x) => x + direction),
    [offset]
  )

  const formattedPeriod = React.useMemo(() => {
    switch (unit) {
      case 'week':
        return formatDateRange(period[0], period[1])
      case 'month':
        return period[0].format('MMMM, YYYY')
      case 'year':
        return period[0].format('YYYY')
    }
  }, [unit, period])

  return (
    <div>
      <WidgetWrapper>
        <H1>Dashboard</H1>
        <div className="flex lg:items-center gap-4 flex-col lg:flex-row">
          <div className="flex items-center">
            {/* arrows */}
            <div className="flex gap-x-2 mr-4">
              <RoundButton onClick={onNavigate(-1)} icon="ArrowBack" />
              <RoundButton onClick={onNavigate(1)} icon="ArrowForward" />
            </div>

            {/* unit picker */}
            <Select
              className="py-[5px]"
              options={[
                { value: 'week', label: 'Week' },
                { value: 'month', label: 'Month' },
                { value: 'year', label: 'Year' },
              ]}
              value={unit}
              onChange={(value) => {
                setOffset(0)
                setUnit(value as Unit)
              }}
              containerClassName="mr-2"
            />
          </div>

          {/* date */}
          <div className="flex-1">
            {formattedPeriod}
            <span className="text-text-tertiary ml-4">
              {offset > 1 && `In ${Math.abs(offset)} ${unit}s`}
              {offset === 1 && `Next ${unit}`}
              {offset === 0 && `Current ${unit}`}
              {offset === -1 && `Previous ${unit}`}
              {offset < -1 && `${Math.abs(offset)} ${unit}s ago`}
            </span>
          </div>
        </div>
      </WidgetWrapper>

      {portalGroups.map((pg) => (
        <div key={pg.id} className="_mt-12">
          {pg.components.map(
            renderComponent({
              period,
              unit,
            })
          )}
        </div>
      ))}
    </div>
  )
}
