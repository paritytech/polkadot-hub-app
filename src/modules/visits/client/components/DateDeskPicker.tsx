import React from 'react'
import { useStore } from '@nanostores/react'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isTodayPlugin from 'dayjs/plugin/isToday'
import objectPlugin from 'dayjs/plugin/toObject'
import utc from 'dayjs/plugin/utc'
import weekdayPlugin from 'dayjs/plugin/weekday'
import { DatePicker } from '#client/components/DatePicker'
import { OfficeFloorMap } from '#client/components/OfficeFloorMap'
import {
  Button,
  ButtonsWrapper,
  FButton,
  H2,
  P,
  Select,
  Tag,
  WidgetWrapper,
} from '#client/components/ui'
import * as stores from '#client/stores'
import { DATE_FORMAT } from '#client/constants'
import { OfficeArea, VisitRequest } from '#shared/types'
import { cn, generateId, toggleInArray } from '#client/utils'
import {
  pick,
  prop,
  propEq,
  propNotEq,
  propNotIn,
  uniq,
} from '#shared/utils/fp'
import Permissions from '#shared/permissions'
import {
  useAvailableDesks,
  useVisitConfig,
  useVisits,
  useVisitsAreas,
} from '../queries'

dayjs.extend(weekdayPlugin)
dayjs.extend(objectPlugin)
dayjs.extend(isTodayPlugin)
dayjs.extend(utc)
dayjs.extend(isoWeek)
dayjs.extend(isSameOrAfter)

type Result = {
  id: string
  dates: string[]
  areaId: string
  deskId: string
}

type Props = {
  officeId: string
  onSubmit: (request: VisitRequest[]) => void
}

export const DateDeskPicker: React.FC<Props> = ({ officeId, onSubmit }) => {
  const permissions = useStore(stores.permissions)
  const [selectedDates, setSelectedDates] = React.useState<string[]>([])
  const onToggleDate = React.useCallback(
    (date: string) => setSelectedDates((xs) => toggleInArray(xs, date, true)),
    []
  )

  const { data: config } = useVisitConfig(officeId)
  const { data: upcomingVisits = [] } = useVisits(officeId, undefined, {
    retry: false,
  })
  const { data: areas = [] } = useVisitsAreas(officeId)
  const [areaId, setAreaId] = React.useState<string | null>(null)
  React.useEffect(() => {
    if (areas.length) {
      setAreaId(areas[0].id)
    }
  }, [areas])
  const area = React.useMemo(() => areas.find((x) => areaId === x.id), [areaId])
  const onAreaChange = React.useCallback(
    (areaId: string) => setAreaId(areaId),
    []
  )

  const { data: availableDesks = [], isLoading: isAvailableDesksLoading } =
    useAvailableDesks(officeId, selectedDates)

  const availableAreaDeskIds = React.useMemo(() => {
    return availableDesks
      .filter((x) => x.areaId === area?.id)
      .map((x) => x.deskId)
  }, [availableDesks, area])

  const reservedDates = React.useMemo(() => {
    if (permissions.has(Permissions.visits.AdminManage)) {
      return []
    }
    return upcomingVisits.map(prop('date'))
  }, [upcomingVisits, permissions])

  const [selectedDeskId, setSelectedDeskId] = React.useState<string | null>(
    null
  )
  const onToggleDesk = React.useCallback((deskId: string) => {
    setSelectedDeskId((value) => (value === deskId ? null : deskId))
  }, [])

  const [pendingResult, setPendingResult] = React.useState<Result | null>(null)
  React.useEffect(() => {
    if (area && selectedDates.length && selectedDeskId) {
      setPendingResult({
        id: generateResultId(),
        dates: selectedDates,
        areaId: area.id,
        deskId: selectedDeskId,
      })
    } else {
      setPendingResult(null)
    }
  }, [area, selectedDates, selectedDeskId])

  // TODO: test it
  React.useEffect(() => {
    if (
      selectedDeskId &&
      (!availableAreaDeskIds.includes(selectedDeskId) || !selectedDates.length)
    ) {
      setSelectedDeskId(null)
    }
  }, [availableAreaDeskIds, selectedDeskId, selectedDates])
  const [confirmedResults, setConfirmedResults] = React.useState<Result[]>([])

  const onConfirmResult = React.useCallback(() => {
    if (pendingResult) {
      setConfirmedResults((xs) => [...xs, pendingResult])
      setPendingResult(null)
      setSelectedDates([])
      setSelectedDeskId(null)
    }
  }, [pendingResult])
  const preReservedDates = React.useMemo(
    () =>
      confirmedResults
        .map(prop('dates'))
        .flat()
        .reduce(uniq, [] as string[]),
    [confirmedResults]
  )
  const onRemoveResult = React.useCallback((id: string | null) => {
    if (id) {
      setConfirmedResults((xs) => xs.filter(propNotEq('id', id)))
    } else {
      setPendingResult(null)
      setSelectedDates([])
      setSelectedDeskId(null)
    }
  }, [])

  const submitHandler = React.useCallback(() => {
    const getFields = pick(['dates', 'areaId', 'deskId'])
    const result: VisitRequest[] = confirmedResults.map(
      getFields
    ) as VisitRequest[]
    if (pendingResult) {
      result.push(getFields(pendingResult) as VisitRequest)
    }
    onSubmit(result)
  }, [confirmedResults, pendingResult])

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

  if (!config) {
    return null
  }

  return (
    <div className="px-2 lg:px-4">
      <div className="block lg:flex">
        <div className="mb-4 lg:w-[500px] lg:mr-4 lg:mb-0">
          <div className="mb-4">
            <WidgetWrapper>
              <H2 className="font-extra">📅 Office Visiting days</H2>
              <p className="mb-5">
                Please select desired dates for you visits.
              </p>
              <DatePicker
                workingDays={config.workingDays}
                availableDateRange={config?.bookableDays}
                selectedDates={selectedDates}
                onToggleDate={onToggleDate}
                preReservedDates={preReservedDates}
                reservedDates={reservedDates}
              />
            </WidgetWrapper>
          </div>
          {!!(pendingResult || confirmedResults.length) && (
            <WidgetWrapper className="hidden lg:block">
              <Results
                areas={areas}
                pendingResult={pendingResult}
                confirmedResults={confirmedResults}
                onConfirmResult={onConfirmResult}
                onRemoveResult={onRemoveResult}
                onSubmit={submitHandler}
              />
            </WidgetWrapper>
          )}
        </div>
        <div className="flex-1 flex-shrink">
          <WidgetWrapper
            className={cn(
              !selectedDates.length && 'pointer-events-none opacity-50'
            )}
          >
            <H2 className="font-extra">🪑 Workplace</H2>
            <P className="mb-3 text-text-secondary" textType="additional">
              Please select a desk by clicking on a button on the floor map.
            </P>
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
                      {unavailableDeskNames.length !== 1 ? 'are' : 'is'} not
                      available for booking.
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
                value={selectedDeskId || undefined}
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
                  selectedDeskId={selectedDeskId}
                  onToggleDesk={onToggleDesk}
                />
              </div>
            )}
          </WidgetWrapper>
        </div>

        {!!(pendingResult || confirmedResults.length) && (
          <WidgetWrapper className="sticky bottom-2 border-gray-300 lg:hidden mt-4">
            <Results
              areas={areas}
              pendingResult={pendingResult}
              confirmedResults={confirmedResults}
              onConfirmResult={onConfirmResult}
              onRemoveResult={onRemoveResult}
              onSubmit={submitHandler}
            />
          </WidgetWrapper>
        )}
      </div>
    </div>
  )
}

type ResultsProps = {
  areas: OfficeArea[]
  pendingResult: Result | null
  confirmedResults: Result[]
  onConfirmResult: () => void
  onRemoveResult: (id: string | null) => void
  onSubmit: () => void
}
const Results: React.FC<ResultsProps> = ({
  areas,
  pendingResult,
  onConfirmResult,
  confirmedResults,
  onRemoveResult,
  onSubmit,
}) => {
  const onChooseMoreDates = React.useCallback(
    (ev: React.MouseEvent<HTMLButtonElement>) => {
      ev.preventDefault()
      if (pendingResult) {
        onConfirmResult()
      }
    },
    [pendingResult, onConfirmResult]
  )
  const onClickSubmit = React.useCallback(
    (ev: React.MouseEvent<HTMLButtonElement>) => {
      ev.preventDefault()
      onSubmit()
    },
    [onSubmit]
  )
  return (
    <div>
      <H2 className="hidden lg:block">Reservation summary</H2>
      <b className="lg:hidden block mb-4">Reservation summary</b>
      {confirmedResults.map((result, i) => (
        <ResultItem
          key={result.id}
          areas={areas}
          result={result}
          status="confirmed"
          onRemove={onRemoveResult}
        />
      ))}
      {!!pendingResult && (
        <ResultItem
          areas={areas}
          result={pendingResult}
          status="pending"
          onRemove={onRemoveResult}
        />
      )}
      <ButtonsWrapper
        className="mt-2"
        right={[
          <FButton
            disabled={!pendingResult}
            kind="secondary"
            onClick={onChooseMoreDates}
          >
            Add another desk
          </FButton>,
          <FButton kind="primary" onClick={onClickSubmit}>
            Submit
          </FButton>,
        ]}
      />
    </div>
  )
}

type ResultItemProps = {
  areas: OfficeArea[]
  result: Result
  status: 'pending' | 'confirmed'
  onRemove: (id: string | null) => void
  className?: string
}
const ResultItem: React.FC<ResultItemProps> = ({
  areas,
  result,
  status,
  onRemove,
  className,
}) => {
  const area = areas.find(propEq('id', result.areaId))
  const areaName = area?.name
  const deskName = area?.desks.find(propEq('id', result.deskId))?.name
  const onRemoveItem = React.useCallback(
    (id: string | null) => (ev: React.MouseEvent<HTMLButtonElement>) => {
      ev.preventDefault()
      onRemove(id)
    },
    [status, result.id, onRemove]
  )
  const dates = result.dates.map((x) => dayjs(x, DATE_FORMAT).format('D MMM'))
  return (
    <div className={cn('flex items-top mb-4', className)}>
      <div className="flex-1 flex flex-wrap flex-col">
        {/* <Tag color="gray" className="mr-2"> */}
        {/* </Tag> */}
        <div className="flex flex-wrap">
          <span className="text-text-tertiary inline-block mr-1">Dates:</span>
          {dates.map((x, i) => (
            <span key={x} className="whitespace-nowrap mr-1">
              {x}
              {i !== dates.length - 1 && ','}
            </span>
          ))}
        </div>
        <div>
          <span className="text-text-tertiary inline-block mr-1">Desk:</span>
          {deskName}, {areaName}
        </div>
      </div>
      <div>
        <Button
          kind="secondary"
          size="small"
          className="rounded-full text-text-tertiary"
          onClick={onRemoveItem(status === 'confirmed' ? result.id : null)}
        >
          Remove
        </Button>
      </div>
    </div>
  )
}

function generateResultId() {
  return generateId(8, 'r_')
}
