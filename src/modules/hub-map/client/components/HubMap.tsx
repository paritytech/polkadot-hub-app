import * as React from 'react'
import { Select, WidgetWrapper } from '#client/components/ui'
import { useStore } from '@nanostores/react'
import * as stores from '#client/stores'
import { useOffice } from '#client/utils/hooks'
import dayjs, { Dayjs } from 'dayjs'
import { DaySlider } from '#client/components/ui/DaySlider'
import { OfficeVisitsNumber } from '#client/components/OfficeVisitsNumber'
import { DATE_FORMAT } from '#client/constants'
import config from '#client/config'
import { OfficeFloorMap } from '#client/components/OfficeFloorMap'
import { DailyEventsList } from './DailyEventsList'
import { useVisitsAreas } from '#modules/visits/client/queries'

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

  const { data: areas = [] } = useVisitsAreas(office?.id || '')
  const [areaId, setAreaId] = React.useState<string | null>(null)
  const area = React.useMemo(() => areas.find((x) => areaId === x.id), [areaId])

  const [date, setDate] = React.useState(dayjs())
  const [selectedDeskId, setSelectedDeskId] = React.useState<string | null>(
    null
  )
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

  return (
    <WidgetWrapper className="transition-all delay-100" title={`Hub Map`}>
      <div className="grid grid-flow-row gap-4">
        <div className="">
          <DailyEventsList
            onChooseCard={(deskId, areaId, chosenDate) => {
              setSelectedDeskId(deskId)
              setAreaId(areaId)
              setDate(chosenDate)
            }}
            setOfficeVisits={setOfficeVisits}
            setDate={setDate}
            date={date}
          />

          {area && (
            <div className="mt-6">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-4 items-center justify-center">
                    <DaySlider
                      onChange={setDate}
                      reverse={true}
                      slideDate={date.format('YYYY-MM-DD')}
                    />
                    <OfficeVisitsNumber className="mt-2" date={date} />
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
                  />
                </div>
              </div>
              <div className="max-w-[780px] m-auto my-10">
                <OfficeFloorMap
                  area={area}
                  officeVisits={officeVisits}
                  showUsers={true}
                  selectedDeskId={selectedDeskId}
                  selectedAreaId={areaId}
                  onToggleDesk={(selectedDesk) =>
                    goToVisits(selectedDesk, String(areaId), date)
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </WidgetWrapper>
  )
}
