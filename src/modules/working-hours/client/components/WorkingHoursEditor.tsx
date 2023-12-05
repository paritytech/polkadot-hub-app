import * as React from 'react'
import dayjs, { Dayjs } from 'dayjs'
import {
  ComponentWrapper,
  FButton,
  H2,
  HR,
  HeaderWrapper,
  Icons,
  LoaderSpinner,
  Modal,
  P,
  RoundButton,
  TimeRangePicker,
  showNotification,
} from '#client/components/ui'
import * as stores from '#client/stores'
import { groupBy, sortWith } from '#shared/utils/fp'
import { cn, formatDateRange } from '#client/utils'
import { DATE_FORMAT } from '#client/constants'
import {
  DefaultWorkingHoursEntry,
  DefaultWorkingHoursEntryUpdateRequest,
  TimeOffRequestUnit,
  WorkingHoursConfig,
  WorkingHoursEntry,
  WorkingHoursEntryCreationRequest,
  WorkingHoursEntryUpdateRequest,
} from '#shared/types'
import {
  useEntries,
  useDeleteEntry,
  useConfig,
  useCreateEntries,
  useUpdateEntry,
  useDefaultEntries,
  useCreateDefaultEntry,
  useDeleteDefaultEntry,
  useUpdateDefaultEntry,
  useTimeOffRequests,
} from '../queries'
import {
  formatTimeString,
  getTodayDate,
  getWeekLabel,
  prefillWithDefaults,
} from '../helpers'
import {
  TimeOff,
  calculateTotalWorkingHours,
  getDurationString,
  getEditableDaysSet,
  getTimeOffByDate,
  getTimeOffNotation,
} from '../../shared-helpers'

function extractDateFromUrlHash(): string | null {
  const hash = window.location.hash
  const date = hash.slice(1)
  const dateFormatRegex = /^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/
  if (!dateFormatRegex.test(date)) {
    return null
  }
  return date
}

export const WorkingHoursEditor: React.FC = () => {
  const dateRefs = React.useRef<Record<string, HTMLDivElement>>({})

  const [showDefaultEntriesModal, setShowDefaultEntriesModal] =
    React.useState(false)
  const [offset, setOffset] = React.useState<number>(
    (() => {
      const date = extractDateFromUrlHash()
      if (!date) return 0
      const targetWeek = dayjs(date).startOf('isoWeek')
      const currentWeek = dayjs().startOf('isoWeek')
      return targetWeek.diff(currentWeek, 'week')
    })()
  )

  const {
    data: moduleConfig = null,
    isFetched: isModuleConfigFetched,
    refetch: refetchModuleConfig,
  } = useConfig()

  const period = React.useMemo<[Dayjs, Dayjs]>(() => {
    const start = dayjs().startOf('isoWeek').add(offset, 'week')
    const end = start.endOf('isoWeek')
    return [start, end]
  }, [offset])

  const editableDays = React.useMemo(
    () => getEditableDaysSet(moduleConfig),
    [moduleConfig]
  )

  const { data: entries = [], refetch: refetchEntries } = useEntries(
    period[0].format(DATE_FORMAT),
    period[1].format(DATE_FORMAT),
    { enabled: !!moduleConfig }
  )
  const { data: timeOffRequests = [] } = useTimeOffRequests(
    period[0].format(DATE_FORMAT),
    period[1].format(DATE_FORMAT),
    {
      enabled: !!moduleConfig,
    }
  )

  const timeOffByDate = React.useMemo(
    () => getTimeOffByDate(timeOffRequests),
    [timeOffRequests]
  )

  const refetch = () => {
    refetchEntries()
    showNotification('Your working hours successfully updated', 'success')
  }
  const { mutate: createEntries } = useCreateEntries(refetch)
  const { mutate: deleteEntry } = useDeleteEntry(refetch)
  const { mutate: updateEntry } = useUpdateEntry(refetch)

  const days = React.useMemo<Dayjs[]>(() => {
    return Array(7)
      .fill(null)
      .map((x, i) => period[0].add(i, 'day'))
  }, [period])

  const hasEditableDays = React.useMemo(() => {
    return days.some((x) => editableDays.has(x.format(DATE_FORMAT)))
  }, [days, editableDays])

  const entriesByDate = React.useMemo(() => {
    // group by date
    const result = (entries || []).reduce(
      groupBy('date'),
      {} as Record<string, WorkingHoursEntry[]>
    )
    // sort entries by startTime for each date
    for (const date in result) {
      result[date] = result[date].sort(
        sortWith((x) => {
          const [h, m] = x.startTime.split(':').map(Number)
          return h * 60 + m
        })
      )
    }
    return result
  }, [entries])

  const totalWorkingHours = React.useMemo(() => {
    return calculateTotalWorkingHours(entries)
  }, [entries])

  const totalWorkingHoursByDate = React.useMemo(() => {
    const result: Record<string, [number, number] | null> = {}
    for (const date in entriesByDate) {
      result[date] = calculateTotalWorkingHours(entriesByDate[date])
    }
    return result
  }, [entriesByDate])

  const weekLabel = React.useMemo(() => getWeekLabel(offset), [offset])

  const onFillWithDefaults = React.useCallback(
    (mode: 'day' | 'week', date: Dayjs) => () => {
      if (!moduleConfig) return
      createEntries(
        prefillWithDefaults(mode, date, moduleConfig, timeOffRequests)
      )
    },
    [moduleConfig, timeOffRequests]
  )

  const scrollToDate = React.useCallback((date: string) => {
    const selectedDateEl = dateRefs.current[date]
    if (selectedDateEl) {
      window.scrollTo({
        top: selectedDateEl.offsetTop - 100,
        behavior: 'smooth',
      })
      selectedDateEl.classList.add('bg-yellow-100')
      setTimeout(() => {
        selectedDateEl.classList.remove('bg-yellow-100')
      }, 3e3)
    }
  }, [])

  const onNavigate = React.useCallback(
    (direction: -1 | 1) => () => setOffset((x) => x + direction),
    [offset]
  )

  React.useEffect(() => {
    const date = extractDateFromUrlHash()
    if (date) {
      history.pushState(
        '',
        document.title,
        window.location.pathname + window.location.search
      )
      setTimeout(scrollToDate, 500, date)
    }
  }, [entries])

  React.useEffect(() => {
    if (isModuleConfigFetched && !moduleConfig) {
      setTimeout(() => stores.goTo('home'), 0)
    }
  }, [isModuleConfigFetched, moduleConfig])

  return !!moduleConfig ? (
    <div className="flex flex-col gap-y-2">
      {/* header */}
      <ComponentWrapper>
        <HeaderWrapper title="Working Hours">
          <div>
            {moduleConfig.personalDefaultEntries.length ? (
              <div className="-my-2">
                Your default working hours:{' '}
                {moduleConfig.personalDefaultEntries
                  .sort(
                    sortWith((x) => {
                      const [h, m] = x[0].split(':').map(Number)
                      return h * 60 + m
                    })
                  )
                  .map(
                    (x) =>
                      `${formatTimeString(x[0])} - ${formatTimeString(x[1])}`
                  )
                  .join(', ')}{' '}
                <FButton
                  kind="link"
                  size="small"
                  onClick={() => setShowDefaultEntriesModal(true)}
                >
                  Edit
                </FButton>
              </div>
            ) : (
              <div className="-mx-2 -mb-2 mt-4">
                <FButton
                  kind="link"
                  size="small"
                  onClick={() => setShowDefaultEntriesModal(true)}
                  className="w-full"
                >
                  Configure your default working hours
                </FButton>
              </div>
            )}
          </div>
        </HeaderWrapper>
      </ComponentWrapper>

      {/* week calendar */}
      <ComponentWrapper>
        <div
          className={cn(
            'flex items-center gap-x-2 rounded-tiny',
            '-mx-4 sm:-mx-6 -mt-4 sm:-mt-6 px-4 py-2 mb-4 sm:px-6 sm:py-4',
            'bg-fill-6/[0.025]'
          )}
        >
          <div className="flex-1 flex items-center h-12">
            <div className="flex gap-x-2 mr-4">
              <RoundButton onClick={onNavigate(-1)} icon="ArrowBack" />
              <RoundButton onClick={onNavigate(1)} icon="ArrowForward" />
            </div>
            <H2 className="m-0 my-2 font-primary font-medium">
              {formatDateRange(period[0], period[1])}
            </H2>
            <div className="hidden sm:block ml-3 font-primary text-base text-text-tertiary whitespace-nowrap">
              {weekLabel}
            </div>
          </div>
          <div className="flex items-center">
            {!!totalWorkingHours && (
              <span className="text-cta-purple px-2 py-1 bg-cta-hover-purple rounded-tiny flex items-center">
                <Icons.Clock fillClassName="fill-cta-purple" className="mr-2" />
                {getDurationString(totalWorkingHours)}
              </span>
            )}
            {!totalWorkingHours &&
              !!moduleConfig.canPrefillWeek &&
              hasEditableDays && (
                <FButton
                  size="small"
                  kind="secondary"
                  className="-mr-2"
                  onClick={onFillWithDefaults('week', period[0])}
                >
                  Prefill week
                </FButton>
              )}
          </div>
        </div>
        <div className="-mx-2 rounded-tiny bg-bg-primary flex flex-col">
          {days.map((day, i) => {
            const date = day.format(DATE_FORMAT)
            const editable = editableDays.has(date)
            const timeOff = timeOffByDate[date]
            return (
              <div
                key={date}
                ref={(el) => {
                  if (el && dateRefs?.current) {
                    dateRefs.current[date] = el
                  }
                }}
                className="transition ease-in-out duration-1000"
              >
                {!!i && <HR />}
                <DayRow
                  moduleConfig={moduleConfig}
                  entriesByDate={entriesByDate}
                  day={day}
                  totalWorkingHoursByDate={totalWorkingHoursByDate}
                  createEntries={createEntries}
                  updateEntry={updateEntry}
                  deleteEntry={deleteEntry}
                  editable={editable}
                  timeOff={timeOff}
                  onFillWithDefaults={onFillWithDefaults}
                />
              </div>
            )
          })}
        </div>
      </ComponentWrapper>

      {/* extra */}
      {showDefaultEntriesModal && (
        <DefaultEntriesModal
          moduleConfig={moduleConfig}
          onClose={() => setShowDefaultEntriesModal(false)}
          refetchModuleConfig={refetchModuleConfig}
        />
      )}
    </div>
  ) : (
    <div className="min-h-[300px]">
      <LoaderSpinner />
    </div>
  )
}

type DayRowProps = {
  moduleConfig: WorkingHoursConfig
  entriesByDate: Record<string, WorkingHoursEntry[]>
  day: Dayjs
  totalWorkingHoursByDate: Record<string, [number, number] | null>
  createEntries: (entries: WorkingHoursEntryCreationRequest[]) => void
  deleteEntry: (id: string) => void
  updateEntry: (value: WorkingHoursEntryUpdateRequest) => void
  editable: boolean
  timeOff: TimeOff | null
  onFillWithDefaults: (mode: 'day' | 'week', day: Dayjs) => () => void
}
const DayRow: React.FC<DayRowProps> = ({
  moduleConfig,
  day,
  entriesByDate,
  totalWorkingHoursByDate,
  createEntries,
  updateEntry,
  deleteEntry,
  editable = false,
  timeOff,
  onFillWithDefaults,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const todayDate = getTodayDate()
  const date = day.format(DATE_FORMAT)
  const isWeekend = [0, 6].includes(day.day())
  const dayEntries = entriesByDate[date] || []
  const hasEntries = !!dayEntries.length
  const totalWorkingHours = totalWorkingHoursByDate[date] || null
  const isFullDayTimeOff = timeOff?.unit === TimeOffRequestUnit.Day

  const [showNewEntryInput, setShowNewEntryInput] = React.useState(false)
  const [newEntryTime, setNewEntryTime] = React.useState<[string, string]>([
    '',
    '',
  ])

  const timeOffNotation = React.useMemo(
    () => (timeOff ? getTimeOffNotation(timeOff) : null),
    [timeOff]
  )

  const onChangeNewEntryTime = React.useCallback((from: string, to: string) => {
    setNewEntryTime([from, to])
  }, [])
  const onSaveNewEntry = React.useCallback(() => {
    createEntries([
      {
        date: day.format(DATE_FORMAT),
        startTime: newEntryTime[0],
        endTime: newEntryTime[1],
      },
    ])
    setShowNewEntryInput(false)
    setNewEntryTime(['', ''])
  }, [newEntryTime, date, createEntries])

  const onAddEntry = React.useCallback(() => {
    setShowNewEntryInput(!showNewEntryInput)
    if (!showNewEntryInput) {
      setTimeout(() => {
        const firstTimeInput: HTMLInputElement = containerRef.current
          ?.querySelector('[data-new-entry]')
          ?.querySelector('input[type="time"]')!
        if (firstTimeInput) firstTimeInput.focus()
      }, 100)
    }
  }, [showNewEntryInput])

  return (
    <div className="py-4 px-2" ref={containerRef}>
      <div className="flex">
        <div className={cn(isWeekend && 'text-text-tertiary', 'flex-1')}>
          {todayDate === day.format(DATE_FORMAT) ? (
            <span>
              <span className="text-accents-red">Today</span>
              {day.format(', D MMMM')}{' '}
            </span>
          ) : (
            <span>{day.format('dddd, D MMMM')} </span>
          )}
          {hasEntries && !!totalWorkingHours && (
            <span className="text-cta-purple px-2 py-1 bg-cta-hover-purple rounded-tiny mr-1">
              {getDurationString(totalWorkingHours)}
            </span>
          )}
          {timeOff && (
            <span className="text-yellow-600 px-2 py-1 bg-yellow-100 rounded-tiny">
              {timeOffNotation}
            </span>
          )}
        </div>
        <div className="-mx-2 -my-2 flex">
          {editable &&
            moduleConfig.canPrefillWeek &&
            !hasEntries &&
            !!timeOff &&
            !isWeekend && (
              <FButton
                kind="link"
                size="small"
                className="text-text-tertiary"
                onClick={onFillWithDefaults('day', day)}
              >
                Prefill
              </FButton>
            )}
          {editable && (
            <FButton
              kind="link"
              size="small"
              onClick={onAddEntry}
              className={cn(
                (isWeekend || isFullDayTimeOff) && 'text-text-tertiary'
              )}
            >
              Add entry
            </FButton>
          )}
        </div>
      </div>

      <div className="sm:pl-6">
        {hasEntries ? (
          <div className="flex flex-col mb-1 gap-y-1 mt-4">
            {dayEntries.map((x) => (
              <EntryRow
                editable={editable}
                key={x.id}
                entry={x}
                deleteEntry={deleteEntry}
                updateEntry={updateEntry}
              />
            ))}
          </div>
        ) : (
          <div></div>
        )}

        {showNewEntryInput && (
          <div
            data-new-entry
            className={cn(
              'flex gap-x-1 items-center',
              hasEntries ? 'mt-1' : 'mt-4'
            )}
          >
            <Icons.EntryArrow
              fillClassName="fill-fill-18"
              className="-mt-1 mr-1 hidden sm:block"
            />
            <TimeRangePicker
              from={newEntryTime[0]}
              to={newEntryTime[1]}
              inputClassName="px-0 py-[8px] w-28 text-center no-input-buttons"
              onChange={onChangeNewEntryTime}
            />
            <FButton kind="primary" size="small" onClick={onSaveNewEntry}>
              Save
            </FButton>
            <RoundButton
              onClick={() => setShowNewEntryInput(false)}
              icon="Cross"
            />
          </div>
        )}
      </div>
    </div>
  )
}

type EntryRowProps = {
  entry: WorkingHoursEntry | DefaultWorkingHoursEntry
  deleteEntry: (id: string) => void
  updateEntry: (
    value:
      | WorkingHoursEntryUpdateRequest
      | DefaultWorkingHoursEntryUpdateRequest
  ) => void
  editable: boolean
}
const EntryRow: React.FC<EntryRowProps> = ({
  entry,
  deleteEntry,
  updateEntry,
  editable = false,
}) => {
  const [time, setTime] = React.useState<[string, string]>([
    entry.startTime,
    entry.endTime,
  ])
  const [changed, setChanged] = React.useState(false)
  const onDelete = React.useCallback(() => {
    deleteEntry(entry.id)
  }, [entry])
  const onChange = React.useCallback(
    (from: string, to: string) => {
      if (!editable) return
      setTime([from, to])
      setChanged(true)
    },
    [editable]
  )
  const onSave = React.useCallback(() => {
    updateEntry({ id: entry.id, startTime: time[0], endTime: time[1] })
    setChanged(false)
  }, [entry, time])
  const onCancel = React.useCallback(() => {
    setTime([entry.startTime, entry.endTime])
    setChanged(false)
  }, [time])
  return (
    <div className="flex gap-x-1 items-center">
      <Icons.EntryArrow
        fillClassName="fill-fill-18"
        className="-mt-1 mr-1 hidden sm:block"
      />
      <TimeRangePicker
        from={time[0]}
        to={time[1]}
        inputClassName="px-0 py-[8px] w-28 text-center no-input-buttons"
        onChange={onChange}
      />
      {editable && (
        <>
          {changed ? (
            <>
              <FButton kind="primary" size="small" onClick={onSave}>
                Save
              </FButton>
              <FButton kind="secondary" size="small" onClick={onCancel}>
                Cancel
              </FButton>
            </>
          ) : (
            <RoundButton onClick={onDelete} icon="Cross" />
          )}
        </>
      )}
    </div>
  )
}

type DefaultEntriesModalProps = {
  onClose: () => void
  moduleConfig: WorkingHoursConfig
  refetchModuleConfig: () => void
}
const DefaultEntriesModal: React.FC<DefaultEntriesModalProps> = ({
  onClose,
  moduleConfig,
  refetchModuleConfig,
}) => {
  const newEntryRef = React.useRef<HTMLDivElement>(null)
  const [showNewEntryInput, setShowNewEntryInput] = React.useState(false)
  const [newEntryTime, setNewEntryTime] = React.useState<[string, string]>([
    '',
    '',
  ])

  const { data: entries = [], refetch: refetchDefaultEntries } =
    useDefaultEntries()
  const refetch = () => {
    refetchDefaultEntries()
    refetchModuleConfig()
    showNotification('Your default working hours have changed', 'success')
  }
  const { mutate: createDefaultEntry } = useCreateDefaultEntry(refetch)
  const { mutate: updateDefaultEntry } = useUpdateDefaultEntry(refetch)
  const { mutate: deleteDefaultEntry } = useDeleteDefaultEntry(refetch)

  const sortedEntries = React.useMemo(() => {
    return entries.sort(
      sortWith((x) => {
        const [h, m] = x.startTime.split(':').map(Number)
        return h * 60 + m
      })
    )
  }, [entries])

  const onAddEntry = React.useCallback(() => {
    setShowNewEntryInput(!showNewEntryInput)
    if (!showNewEntryInput) {
      setTimeout(() => {
        const firstTimeInput: HTMLInputElement =
          newEntryRef.current?.querySelector('input[type="time"]')!
        if (firstTimeInput) firstTimeInput.focus()
      }, 100)
    }
  }, [showNewEntryInput])
  const onChangeNewEntryTime = React.useCallback((from: string, to: string) => {
    setNewEntryTime([from, to])
  }, [])
  const onSaveNewEntry = React.useCallback(() => {
    createDefaultEntry({
      startTime: newEntryTime[0],
      endTime: newEntryTime[1],
    })
    setShowNewEntryInput(false)
    setNewEntryTime(['', ''])
  }, [newEntryTime])

  return (
    <Modal title="Your default working hours" onClose={onClose}>
      <div className="flex flex-col gap-y-6">
        <div>
          <P>Specify your usual working schedule and use it for prefilling.</P>
          {!entries.length && (
            <P className="text-text-tertiary">
              If your default working hours are not set, the following will be
              used:{' '}
              {moduleConfig.defaultEntries
                .map(
                  (x) => `${formatTimeString(x[0])} - ${formatTimeString(x[1])}`
                )
                .join(', ')}
              .
            </P>
          )}
        </div>
        {(!!sortedEntries.length || showNewEntryInput) && (
          <div className="flex flex-col gap-y-1">
            {sortedEntries.map((x) => (
              <EntryRow
                key={x.id}
                entry={x}
                updateEntry={updateDefaultEntry}
                deleteEntry={deleteDefaultEntry}
                editable={true}
              />
            ))}
            {showNewEntryInput && (
              <div
                ref={newEntryRef}
                className={cn('flex gap-x-1 items-center')}
              >
                <Icons.EntryArrow
                  fillClassName="fill-fill-18"
                  className="-mt-1 mr-1 hidden sm:block"
                />
                <TimeRangePicker
                  from={newEntryTime[0]}
                  to={newEntryTime[1]}
                  inputClassName="px-0 py-[8px] w-28 text-center no-input-buttons"
                  onChange={onChangeNewEntryTime}
                />
                <FButton kind="primary" size="small" onClick={onSaveNewEntry}>
                  Save
                </FButton>
                <RoundButton
                  onClick={() => setShowNewEntryInput(false)}
                  icon="Cross"
                />
              </div>
            )}
          </div>
        )}
        {!showNewEntryInput ? (
          <FButton
            kind="secondary"
            onClick={onAddEntry}
            className="w-full mb-2"
          >
            {sortedEntries.length ? 'Add one more entry' : 'Add entry'}
          </FButton>
        ) : (
          <div />
        )}
      </div>
    </Modal>
  )
}
