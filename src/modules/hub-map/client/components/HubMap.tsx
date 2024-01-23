import * as React from 'react'
import { Select, WidgetWrapper } from '#client/components/ui'
import { useStore } from '@nanostores/react'
import * as stores from '#client/stores'
import { useOffice } from '#client/utils/hooks'
import dayjs, { Dayjs } from 'dayjs'
import { DaySlider } from '#client/components/ui/DaySlider'
import { DATE_FORMAT } from '#client/constants'
import config from '#client/config'
import { OfficeFloorMap } from '#client/components/OfficeFloorMap'
import { DailyEventsList } from './DailyEventsList'
import {
  useAvailableDesks,
  useOfficeVisitors,
  useVisitsAreas,
} from '#modules/visits/client/queries'
import { propEq } from '#shared/utils'
import { useOfficeVisitsUpcoming } from '#modules/office-visits/client/queries'

const goToVisits = (selectedDesk: string, areaId: string, date: Dayjs) => {
  const url = new URL(config.appHost + '/visits/request')
  url.searchParams.set('deskId', String(selectedDesk))
  url.searchParams.set('areaId', String(areaId))
  url.searchParams.set('date', date.format(DATE_FORMAT))
  window.location.href = url.toString()
}
export const HubMap = () => {
  const officeId = useStore(stores.officeId)
  const office = useOffice(officeId)
  const me = useStore(stores.me)

  const { data: areas = [] } = useVisitsAreas(office?.id || '')
  const [areaId, setAreaId] = React.useState<string | null>(null)
  const area = React.useMemo(() => areas.find((x) => areaId === x.id), [areaId])

  const [date, setDate] = React.useState(dayjs())
  const [selectedDeskId, setSelectedDeskId] = React.useState<string | null>(
    null
  )
  const { data: upcomingVisitsAll, refetch: refetchVisits } =
    useOfficeVisitsUpcoming(officeId, dayjs().toString())

  React.useEffect(() => {
    setOfficeVisits(upcomingVisitsAll?.byDate[date.format('YYYY-MM-DD')])
  }, [upcomingVisitsAll?.byDate, date])

  const [officeVisits, setOfficeVisits] = React.useState([])
  React.useEffect(() => {
    if (areas.length) {
      setAreaId(areas[0].id)
    }
  }, [areas])

  const onAreaChange = React.useCallback(
    (areaId: string) => setAreaId(areaId),
    []
  )
  // number of office visitors
  const { data: visitors } = useOfficeVisitors(
    officeId,
    dayjs(date).format(DATE_FORMAT)
  )

  const userIsInOffce = React.useMemo(
    () => me && visitors?.some(propEq('userId', me.id)),
    [visitors, me]
  )
  const visitorsNumber = React.useMemo(() => visitors?.length || 0, [visitors])
  const [width, setWidth] = React.useState<number>(window.innerWidth)

  function handleWindowSizeChange() {
    setWidth(window.innerWidth)
  }
  React.useEffect(() => {
    window.addEventListener('resize', handleWindowSizeChange)
    return () => {
      window.removeEventListener('resize', handleWindowSizeChange)
    }
  }, [])

  const { data: availableDesks = [] } = useAvailableDesks(
    office?.id || '',
    [date.format(DATE_FORMAT)] || []
  )

  const resetOfficeVisits = React.useCallback(() => {
    setOfficeVisits(
      upcomingVisitsAll.byDate[dayjs().format('YYYY-MM-DD')] ?? []
    )
  }, [upcomingVisitsAll?.byDate])

  const availableAreaDeskIds = React.useMemo(() => {
    return availableDesks
      .filter((x) => x.areaId === area?.id)
      .map((x) => x.deskId)
  }, [availableDesks, area])

  const isMobile = width <= 768
  return (
    <WidgetWrapper className="transition-all delay-100" title={`Hub Map`}>
      <div className="overflow-none">
        <DailyEventsList
          onChooseCard={(deskId, areaId, chosenDate) => {
            setSelectedDeskId(deskId)
            setAreaId(areaId)
            setDate(chosenDate)
            resetOfficeVisits()
          }}
          setDate={setDate}
          date={date}
          className={'mb-6'}
        />

        {area && (
          <div className="">
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-baseline justify-between mx-auto">
                <div className="w-full sm:w-auto flex flex-col  gap-4 items-start sm:items-baseline justify-center">
                  <DaySlider
                    onChange={setDate}
                    reverse={true}
                    slideDate={date.format('YYYY-MM-DD')}
                    className="mx-auto sm:mx-0"
                  />
                  <div className="text-text-tertiary">
                    {userIsInOffce
                      ? `You and ${visitorsNumber - 1}`
                      : visitorsNumber}{' '}
                    people in the {office?.name} office
                  </div>
                </div>
                <Select
                  label=""
                  options={areas.map((x) => ({
                    label: x.name,
                    value: x.id,
                  }))}
                  value={area?.id}
                  onChange={onAreaChange}
                  placeholder={'Select area'}
                  containerClassName="w-full sm:w-auto  mb-2"
                />
              </div>
            </div>
            <div className="sm:max-w-[780px] h-[500px] sm:h-auto m-auto my-2 sm:my-10">
              <OfficeFloorMap
                area={area}
                officeVisits={officeVisits}
                showUsers={true}
                selectedDeskId={selectedDeskId}
                selectedAreaId={areaId}
                availableDeskIds={availableAreaDeskIds}
                panZoom={isMobile}
                onToggleDesk={(selectedDesk) =>
                  goToVisits(selectedDesk, String(areaId), date)
                }
              />
            </div>
          </div>
        )}
      </div>
    </WidgetWrapper>
  )
}
