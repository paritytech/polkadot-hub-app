import * as React from 'react'
import dayjs, { Dayjs } from 'dayjs'
import {
  useEntries,
  useTimeOffRequests,
  useConfig,
  useCreateEntries,
} from '../queries'
import {
  FButton,
  Icons,
  RoundButton,
  WidgetWrapper,
  showNotification,
} from '#client/components/ui'
import { groupBy, propEq, last, first, eq, sortWith } from '#shared/utils/fp'
import { cn } from '#client/utils'
import { DATE_FORMAT } from '#client/constants'
import { useIntersectionObserver } from '#client/utils/hooks'
import {
  TimeOffRequestUnit,
  WorkingHoursConfig,
  WorkingHoursEntry,
} from '#shared/types'
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

const PREV_WEEKS_NUMBER = 4
const NEXT_WEEKS_NUMBER = 2

export const WorkingHoursWidget: React.FC = () => {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const weekRefs = React.useRef<Record<string, HTMLDivElement>>({})

  const [selectedWeekStart, setSelectedWeekStart] = React.useState<Dayjs>(
    dayjs().startOf('isoWeek')
  )
  const [selectedDate, setSelectedDate] = React.useState<Dayjs | null>(null)

  const selectedDateFormatted = React.useMemo(
    () => (selectedDate ? selectedDate.format(DATE_FORMAT) : null),
    [selectedDate]
  )

  const todayDate = React.useMemo(() => getTodayDate(), [])

  const weeks = React.useMemo(() => {
    const currentWeekStart = dayjs().startOf('isoWeek')
    const periodStart = currentWeekStart.subtract(PREV_WEEKS_NUMBER, 'week')
    return Array(PREV_WEEKS_NUMBER + 1 + NEXT_WEEKS_NUMBER)
      .fill(null)
      .map((w, i) => {
        const weekStart = periodStart.add(i, 'week')
        return Array(7)
          .fill(null)
          .map((d, j) => {
            return weekStart.add(j, 'day')
          })
      })
  }, [todayDate])

  const weekStarts = React.useMemo(
    () => weeks.map((x) => x[0].format(DATE_FORMAT)),
    [weeks]
  )

  const period = React.useMemo<[string, string]>(() => {
    return [
      first(first(weeks)).format(DATE_FORMAT),
      last(last(weeks)).format(DATE_FORMAT),
    ]
  }, [weeks])

  const { data: moduleConfig = null } = useConfig()
  const {
    data: entries = [],
    refetch: refetchEntries,
    isFetched: isEntriesFetched,
  } = useEntries(period[0], period[1], { enabled: !!moduleConfig })
  const { data: timeOffRequests = [] } = useTimeOffRequests(
    period[0],
    period[1],
    {
      enabled: !!moduleConfig,
    }
  )

  const timeOffByDate = React.useMemo(
    () => getTimeOffByDate(timeOffRequests),
    [timeOffRequests]
  )

  const { mutate: createEntries } = useCreateEntries(() => {
    refetchEntries()
    showNotification('Your working hours successfully updated', 'success')
  })

  const editableDays = React.useMemo(
    () => getEditableDaysSet(moduleConfig),
    [moduleConfig]
  )

  const isSelectedDateEditable = React.useMemo(() => {
    return selectedDate
      ? editableDays.has(selectedDate.format(DATE_FORMAT))
      : false
  }, [editableDays, selectedDate])

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

  const selectedDateEntries = React.useMemo(() => {
    return selectedDateFormatted
      ? entriesByDate[selectedDateFormatted] || []
      : []
  }, [selectedDateFormatted, entriesByDate])

  const selectedDateTotalWorkingHours = React.useMemo(() => {
    return calculateTotalWorkingHours(selectedDateEntries)
  }, [selectedDateEntries])

  const isSelectedDateWeekend = React.useMemo(
    () => (selectedDate ? [0, 6].includes(selectedDate.day()) : false),
    [selectedDate]
  )

  const selectedDateTimeOff = React.useMemo(() => {
    return selectedDate
      ? timeOffByDate[selectedDate.format(DATE_FORMAT)] || null
      : null
  }, [selectedDate, timeOffByDate])

  const selectedTimeOffNotation = React.useMemo(() => {
    if (!selectedDateTimeOff) return null
    return getTimeOffNotation(selectedDateTimeOff)
  }, [selectedDateTimeOff])

  const canFillSelectedWeek = React.useMemo(() => {
    const days = Array(7)
      .fill(null)
      .map((x, i) => selectedWeekStart.add(i, 'day').format(DATE_FORMAT))
    return (
      days.some((x) => editableDays.has(x)) &&
      days.map((x) => entriesByDate[x] || []).every((x) => !x.length)
    )
  }, [selectedWeekStart, entriesByDate, editableDays])

  const onSelectDate = React.useCallback(
    (date: Dayjs) => {
      if (selectedDate?.isSame(date, 'day')) {
        setSelectedDate(null)
      } else {
        setSelectedDate(date)
      }
    },
    [selectedDate]
  )

  const onFillWithDefaults = React.useCallback(
    (mode: 'day' | 'week') => () => {
      if (!moduleConfig) return
      const date = mode === 'day' ? selectedDate : selectedWeekStart
      if (!date) return
      const newEntries = prefillWithDefaults(
        mode,
        date,
        moduleConfig,
        timeOffRequests
      )
      createEntries(newEntries)
    },
    [selectedDate, moduleConfig, selectedWeekStart, timeOffRequests]
  )

  const onSelectWeek = React.useCallback(
    (weekStart: Dayjs) => () => {
      setSelectedWeekStart(weekStart)
      if (!weekStart.isSame(selectedDate, 'isoWeek')) {
        setSelectedDate(null)
      }
    },
    [selectedDate]
  )

  const onNavigate = React.useCallback(
    (direction: -1 | 1) => () => {
      const currentIndex = weekStarts.findIndex(
        eq(selectedWeekStart.format(DATE_FORMAT))
      )
      if (
        (direction === 1 && currentIndex + 1 > weekStarts.length - 1) ||
        (direction === -1 && currentIndex <= 0)
      ) {
        return
      }
      const newWeekStart = weekStarts[currentIndex + direction]
      setSelectedDate(null)
      setSelectedWeekStart(dayjs(newWeekStart))
      const weekEl = weekRefs.current[newWeekStart]
      if (weekEl && containerRef.current) {
        containerRef.current.scrollTo({
          left: weekEl.offsetLeft,
          behavior: 'smooth',
        })
      }
    },
    [weekStarts, selectedWeekStart]
  )

  const canNavigate = React.useCallback(
    (direction: -1 | 1) => {
      const currentIndex = weekStarts.findIndex(
        eq(selectedWeekStart.format(DATE_FORMAT))
      )
      if (
        (direction === -1 && currentIndex === 0) ||
        (direction === 1 && currentIndex === weekStarts.length - 1)
      ) {
        return false
      }
      return true
    },
    [selectedWeekStart, weekStarts]
  )

  React.useEffect(() => {
    if (moduleConfig) {
      const currentWeekStart = dayjs().startOf('isoWeek').format(DATE_FORMAT)
      const weekEl = weekRefs.current[currentWeekStart]
      if (weekEl && containerRef.current) {
        containerRef.current.scrollTo(weekEl.offsetLeft, 0)
      }
    }
  }, [moduleConfig])

  const selectingTodayIsProcessed = React.useRef<boolean>(false)
  React.useEffect(() => {
    if (!selectingTodayIsProcessed.current && moduleConfig && entries.length) {
      const today = dayjs().startOf('day')
      if (!moduleConfig.workingDays.includes(today.day())) {
        selectingTodayIsProcessed.current = true
        return
      }
      const todayEntries = entries.filter(
        propEq('date', today.format(DATE_FORMAT))
      )
      if (!todayEntries.length) {
        setSelectedDate(today)
      }
      selectingTodayIsProcessed.current = true
    }
  }, [entries, moduleConfig])

  if (!moduleConfig) return null

  return (
    <WidgetWrapper
      title="Your Working Hours"
      titleUrl="/working-hours"
      className="relative overflow-hidden"
    >
      <div className="absolute right-6 top-4 flex gap-x-2">
        <RoundButton
          onClick={onNavigate(-1)}
          icon="ArrowBack"
          disabled={!canNavigate(-1)}
        />
        <RoundButton
          onClick={onNavigate(1)}
          icon="ArrowForward"
          disabled={!canNavigate(1)}
        />
      </div>
      <div
        ref={containerRef}
        className={cn(
          'relative',
          'overflow-x-scroll overflow-y-auto',
          '-mt-2 -mx-4 sm:-mx-6 pt-6 pb-1',
          'px-4 sm:px-6',
          'no-scrollbar',
          'scroll-p-4 sm:scroll-p-6 snap-x snap-mandatory'
        )}
      >
        <div className={cn('flex gap-x-4 sm:gap-x-6 w-full')}>
          {weeks.map((days, i) => {
            const weekStart = days[0]
            const weekStartFormatted = weekStart.format(DATE_FORMAT)
            return (
              <div
                key={i}
                ref={(el) => {
                  if (el && weekRefs?.current) {
                    weekRefs.current[weekStartFormatted] = el
                  }
                }}
                className="w-full flex-shrink-0 snap-start"
              >
                <Week
                  key={i}
                  days={days}
                  selectedDate={
                    selectedDate ? selectedDate.format(DATE_FORMAT) : null
                  }
                  entriesByDate={entriesByDate}
                  onSelectDate={onSelectDate}
                  onSelectWeek={onSelectWeek(weekStart)}
                  moduleConfig={moduleConfig}
                  timeOffByDate={timeOffByDate}
                />
              </div>
            )
          })}
          <div className="w-0 opacity-0 select-none">x</div>
        </div>
      </div>

      {!!selectedDate && (
        <div className="mt-4">
          {selectedDate?.format('dddd, D MMMM')}{' '}
          {!!selectedDateTotalWorkingHours && (
            <span className="text-cta-purple px-2 py-1 bg-cta-hover-purple rounded-tiny mr-1">
              {getDurationString(selectedDateTotalWorkingHours)}
            </span>
          )}
          {!!selectedDateTimeOff && (
            <span className="text-yellow-600 px-2 py-1 bg-yellow-100 rounded-tiny">
              {selectedTimeOffNotation}
            </span>
          )}
          {/* has entries */}
          {!!(isEntriesFetched && selectedDateEntries.length) && (
            <div className="mt-4 flex gap-x-4 items-end">
              <div className="flex-1">
                {selectedDateEntries.map((x) => (
                  <div key={x.id} className="ml-4 flex gap-x-4 items-center">
                    <Icons.EntryArrow
                      fillClassName="fill-fill-18"
                      className="-mt-1"
                    />
                    <div className="flex items-center">
                      {formatTimeString(x.startTime)} -{' '}
                      {formatTimeString(x.endTime)}
                    </div>
                  </div>
                ))}
              </div>
              {isSelectedDateEditable && (
                <FButton
                  size="small"
                  kind="link"
                  href={`/working-hours#${selectedDateFormatted}`}
                  className="-mb-2"
                >
                  Edit
                </FButton>
              )}
            </div>
          )}
          {/* no entries */}
          {!!(
            isEntriesFetched &&
            !selectedDateEntries.length &&
            isSelectedDateEditable
          ) && (
            <div className="mt-4 flex flex-col gap-y-2">
              <FButton
                kind={
                  isSelectedDateWeekend ||
                  selectedDateTimeOff?.unit === TimeOffRequestUnit.Day
                    ? 'secondary'
                    : 'primary'
                }
                href={`/working-hours#${selectedDateFormatted}`}
              >
                Set working hours
              </FButton>
              {!!moduleConfig.canPrefillDay && !selectedDateTimeOff && (
                <FButton
                  size="small"
                  kind="link"
                  className="block w-full"
                  onClick={onFillWithDefaults('day')}
                >
                  Prefill day with defaults
                </FButton>
              )}
            </div>
          )}
        </div>
      )}
      {/* prefil week */}
      {!!moduleConfig.canPrefillWeek && canFillSelectedWeek && (
        <div className="mt-2">
          <FButton
            size="small"
            kind="link"
            className="block w-full"
            onClick={onFillWithDefaults('week')}
          >
            Prefill week with defaults
          </FButton>
        </div>
      )}
    </WidgetWrapper>
  )
}

type WeekProps = {
  days: Dayjs[]
  onSelectWeek: () => void
  onSelectDate: (date: Dayjs) => void
  entriesByDate: Record<string, WorkingHoursEntry[]>
  selectedDate: string | null
  moduleConfig: WorkingHoursConfig
  timeOffByDate: Record<string, TimeOff>
}
const Week: React.FC<WeekProps> = (props) => {
  const todayDate = getTodayDate()

  const [ref, entry] = useIntersectionObserver()
  React.useEffect(() => {
    if (entry?.intersectionRatio === 1) {
      props.onSelectWeek()
    }
  }, [entry?.intersectionRatio])

  const offset = React.useMemo(
    () => dayjs(props.days[0]).diff(dayjs().startOf('isoWeek'), 'week'),
    []
  )
  const weekLabel = React.useMemo(() => getWeekLabel(offset), [offset])

  return (
    <div ref={ref} className={cn('flex gap-x-1 relative')}>
      {!!offset && (
        <div className="text-text-tertiary absolute left-3 -top-6 text-xs">
          {weekLabel}
        </div>
      )}
      {props.days.map((d, j) => {
        const date = d.format(DATE_FORMAT)
        const isToday = todayDate === date
        const isWorkingDay = props.moduleConfig.workingDays.includes(d.day())
        const isSelected = props.selectedDate === date
        const entries = props.entriesByDate[date] || []
        const withEntries = !!entries.length
        const totalWorkingHours = calculateTotalWorkingHours(entries)
        // const isTimeOff = props.timeOffDates.has(date)
        const timeOff = props.timeOffByDate[date] || null
        let totalWorkingHoursString = ''
        if (totalWorkingHours) {
          const [h, m] = totalWorkingHours
          if (h) {
            totalWorkingHoursString = `${h}h`
            if (m) {
              totalWorkingHoursString += '+'
            }
          } else {
            totalWorkingHoursString = `${m}m`
          }
        }
        return (
          <div
            key={date}
            className={cn(
              'relative',
              'flex-1 h-16 rounded-tiny',
              'text-center pt-2',
              'cursor-pointer',
              'border border-fill-6',
              isSelected
                ? cn(
                    'ring-[1px] ring-inside',
                    withEntries
                      ? 'border-cta-purple/[.40] ring-cta-purple/[.40]'
                      : 'border-fill-30 ring-fill-30'
                  )
                : 'border-fill-6',
              withEntries && 'bg-cta-hover-purple',
              !!timeOff && 'bg-yellow-stripes',
              'hover:opacity-80'
            )}
            onClick={() => props.onSelectDate(d)}
          >
            {isToday && (
              <div className="text-accents-red absolute left-0 right-0 -top-6 text-xs">
                Today
              </div>
            )}
            <div className={cn('text-xs mb-0.75', 'text-text-tertiary')}>
              {d.format('ddd')}
            </div>
            <div className="text-xs text-cta-purple text-center mt-1.5">
              {totalWorkingHours ? (
                <span className="text-cta-purple">
                  {totalWorkingHoursString}
                </span>
              ) : isWorkingDay &&
                (!timeOff || timeOff.unit === TimeOffRequestUnit.Hour) ? (
                <span className="text-text-tertiary">•</span>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
