import * as React from 'react'
import dayjs, { Dayjs } from 'dayjs'
import { H2, H3, Input, RoundButton, Table, Tag } from '#client/components/ui'
import * as fp from '#shared/utils/fp'
import { cn, formatDateRange } from '#client/utils'
import { DATE_FORMAT } from '#client/constants'
import {
  PublicHoliday,
  WorkingHoursConfig,
  WorkingHoursEntry,
} from '#shared/types'
import { useEntries, useTimeOffRequests, usePublicHolidays } from '../queries'
import { getPeriodLabel } from '../helpers'
import {
  OverworkLevel,
  calculateOverwork,
  calculateTotalPublicHolidaysTime,
  calculateTotalTimeOffTime,
  calculateTotalWorkingHours,
  getDurationString,
  getIntervalDates,
  getTimeOffByDate,
  getWeekIndexesRange,
  sumTime,
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

type TotalPerMonth = {
  workingHours: [number, number] | null
  overworkTime: [number, number] | null
  timeOffTime: [number, number] | null
  publicHolidaysTime: [number, number] | null
}

type WeeklyWorkingHours = {
  weekIndex: string
  weekLabel: string | null
  week: string
  workingHours: [number, number] | null
  entries: string
  creationDates: string
  overworkLevel: OverworkLevel
  overworkTime: [number, number] | null
  timeOffTime: [number, number] | null
  timeOffEntries: string
  publicHolidaysTime: [number, number] | null
  publicHolidayEntries: string
}

type TimeOffRef = { weekIndex: string; userId: string; id: string }

export const WorkingHoursEditorMonth: React.FC<{
  moduleConfig: WorkingHoursConfig
}> = ({ moduleConfig }) => {
  const [showEntries, setShowEntries] = React.useState(false)
  const [offset, setOffset] = React.useState<number>(
    (() => {
      const date = extractDateFromUrlHash()
      if (!date) return 0
      const targetMonth = dayjs(date).startOf('month')
      const currentMonth = dayjs().startOf('month')
      return targetMonth.diff(currentMonth, 'month')
    })()
  )

  const startOfMonth = React.useMemo<Dayjs>(
    () => dayjs().add(offset, 'month').startOf('month'),
    [offset]
  )

  const period = React.useMemo<[Dayjs, Dayjs]>(() => {
    const start = dayjs().startOf('month').add(offset, 'month')
    const end = start.endOf('month')
    return [start, end]
  }, [offset])

  const { data: entries = [] } = useEntries(
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
  const { data: publicHolidays = [] } = usePublicHolidays(
    period[0].format(DATE_FORMAT),
    period[1].format(DATE_FORMAT),
    {
      enabled: !!moduleConfig,
    }
  )

  const timeOffRequestsById = React.useMemo(
    () => timeOffRequests.reduce(fp.by('id'), {}),
    [timeOffRequests]
  )
  const timeOffRefsByWeekIndex = React.useMemo(() => {
    const timeOffRefs: TimeOffRef[] = timeOffRequests
      .map((x) =>
        x.dates.map((d) => ({
          weekIndex: dayjs(d, DATE_FORMAT)
            .startOf('isoWeek')
            .format(DATE_FORMAT),
          userId: x.userId,
          id: String(x.id),
        }))
      )
      .flat()
    return timeOffRefs.reduce(fp.groupBy('weekIndex'), {})
  }, [timeOffRequests])

  const entriesByWeekIndex = React.useMemo(() => {
    type IndexedWorkingHoursEntry = WorkingHoursEntry & { weekIndex: string }
    const indexedEntries: IndexedWorkingHoursEntry[] = entries.map((x) => ({
      ...x,
      weekIndex: dayjs(x.date, DATE_FORMAT)
        .startOf('isoWeek')
        .format(DATE_FORMAT),
    }))
    return indexedEntries.reduce<Record<string, WorkingHoursEntry[]>>(
      (acc, x) => {
        if (!acc[x.weekIndex]) acc[x.weekIndex] = []
        const { weekIndex, ...rest } = x
        acc[x.weekIndex].push(rest)
        return acc
      },
      {}
    )
  }, [entries])

  const publicHolidaysByWeekIndex = React.useMemo(() => {
    type IndexedPublicHoliday = PublicHoliday & { weekIndex: string }
    const indexedRecords: IndexedPublicHoliday[] = publicHolidays.map((x) => ({
      ...x,
      weekIndex: dayjs(x.date, DATE_FORMAT)
        .startOf('isoWeek')
        .format(DATE_FORMAT),
    }))
    return indexedRecords.reduce<Record<string, PublicHoliday[]>>((acc, x) => {
      if (!acc[x.weekIndex]) acc[x.weekIndex] = []
      const { weekIndex, ...rest } = x
      acc[x.weekIndex].push(rest)
      return acc
    }, {})
  }, [publicHolidays])

  const weekIndexes = React.useMemo<string[]>(() => {
    return getWeekIndexesRange([
      startOfMonth.format(DATE_FORMAT),
      startOfMonth.endOf('month').format(DATE_FORMAT),
    ]).reverse()
  }, [startOfMonth])

  const weeks = React.useMemo<WeeklyWorkingHours[]>(() => {
    const currentWeekIndex = dayjs().startOf('isoWeek').format(DATE_FORMAT)
    return weekIndexes.map((weekIndex) => {
      const startOfWeek = dayjs(weekIndex, DATE_FORMAT).startOf('isoWeek')
      const endOfWeek = startOfWeek.endOf('isoWeek')
      const daysOfWeek = getIntervalDates(startOfWeek, endOfWeek)
      const weekLabel = currentWeekIndex === weekIndex ? 'Current' : null
      const entriesGroupedByDay = (entriesByWeekIndex[weekIndex] || []).reduce(
        fp.groupBy('date'),
        {}
      )
      const days = Object.keys(entriesGroupedByDay).sort(
        fp.sortWith((x) => dayjs(x, DATE_FORMAT).unix(), 'asc')
      )
      const dayEntries = days
        .map((date) => {
          const dateLabel = dayjs(date, DATE_FORMAT).format('D MMMM')
          const entries = entriesGroupedByDay[date]
            .map((x) => `${x.startTime}-${x.endTime}`)
            .join(', ')
          return `${dateLabel}: ${entries}`
        })
        .join('\n')
      const dayEntryCreationDates = days
        .map((date) => {
          return (entriesGroupedByDay[date] || [])
            .map((x) => dayjs(x.updatedAt).format('D MMMM HH:mm'))
            .join(', ')
        })
        .join('\n')
      const totalWorkingHours = calculateTotalWorkingHours(
        entriesByWeekIndex[weekIndex] || []
      )

      const timeOffRefs = timeOffRefsByWeekIndex[weekIndex] || []
      const timeOffRequestIds = Array.from(
        new Set(timeOffRefs.map(fp.prop('id')))
      )
      const timeOffRequests = timeOffRequestIds.map(
        (x) => timeOffRequestsById[x]
      )
      const timeOffTime = calculateTotalTimeOffTime(
        [startOfWeek, endOfWeek],
        timeOffRequests,
        moduleConfig
      )
      const timeOffByDate = getTimeOffByDate(timeOffRequests)
      const timeOffEntries = daysOfWeek
        .reduce<string[]>((acc, date) => {
          const entry = timeOffByDate[date]
          return !entry
            ? acc
            : [
                ...acc,
                `${dayjs(date, DATE_FORMAT).format('D MMMM')}: ${entry.value} ${
                  entry.unit
                }(s)`,
              ]
        }, [])
        .join('\n')

      const publicHolidays = publicHolidaysByWeekIndex[weekIndex] || []
      const publicHolidaysTime = calculateTotalPublicHolidaysTime(
        publicHolidays,
        moduleConfig
      )
      const publicHolidayEntries = publicHolidays
        .map((x) => `${dayjs(x.date, DATE_FORMAT).format('D MMMM')}: ${x.name}`)
        .join('\n')

      const { time: overworkTime, level: overworkLevel } = calculateOverwork(
        sumTime(totalWorkingHours, timeOffTime, publicHolidaysTime),
        moduleConfig
      )

      return {
        weekIndex,
        weekLabel,
        week: formatDateRange(startOfWeek, endOfWeek),
        entries: dayEntries,
        creationDates: dayEntryCreationDates,
        workingHours: totalWorkingHours,
        overworkLevel,
        overworkTime,
        timeOffTime,
        timeOffEntries,
        publicHolidaysTime,
        publicHolidayEntries,
      }
    })
  }, [
    entriesByWeekIndex,
    timeOffRefsByWeekIndex,
    publicHolidaysByWeekIndex,
    weekIndexes,
    moduleConfig,
  ])

  const totalPerMonth = React.useMemo<TotalPerMonth>(() => {
    return weeks.reduce<TotalPerMonth>(
      (acc, x) => {
        return {
          workingHours: sumTime(acc.workingHours, x.workingHours),
          overworkTime: sumTime(acc.overworkTime, x.overworkTime),
          timeOffTime: sumTime(acc.timeOffTime, x.timeOffTime),
          publicHolidaysTime: sumTime(
            acc.publicHolidaysTime,
            x.publicHolidaysTime
          ),
        }
      },
      {
        workingHours: null,
        overworkTime: null,
        timeOffTime: null,
        publicHolidaysTime: null,
      }
    )
  }, [weeks])

  const columns = React.useMemo(
    () =>
      [
        {
          Header: 'Week',
          accessor: (x: WeeklyWorkingHours) => (
            <span>
              {x.week}
              {!!x.weekLabel && (
                <span className="text-gray-400 ml-2">{x.weekLabel}</span>
              )}
            </span>
          ),
        },
        {
          Header: 'Working hours',
          accessor: (x: WeeklyWorkingHours) => {
            return !!x.workingHours ? (
              <div>
                <div className="flex">
                  <div className="flex-1 flex gap-x-2">
                    {getDurationString(x.workingHours)}
                    {!!x.overworkLevel && !!x.overworkTime && (
                      <Tag size="small" color={x.overworkLevel}>
                        Additional {getDurationString(x.overworkTime)}
                      </Tag>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <span className="text-gray-300">–</span>
            )
          },
        },
        showEntries && {
          Header: 'Entries',
          accessor: (x: WeeklyWorkingHours) => (
            <div className="whitespace-pre">{x.entries}</div>
          ),
        },
        showEntries && {
          Header: 'Entry creation date',
          accessor: (x: WeeklyWorkingHours) => (
            <div className="whitespace-pre">{x.creationDates}</div>
          ),
        },
        {
          Header: 'Time Off',
          accessor: (x: WeeklyWorkingHours) => {
            return x.timeOffTime ? (
              <span>{getDurationString(x.timeOffTime)}</span>
            ) : (
              <span className="text-gray-300">–</span>
            )
          },
        },
        showEntries && {
          Header: 'Time Off Entries',
          accessor: (x: WeeklyWorkingHours) => (
            <div className="whitespace-pre">{x.timeOffEntries}</div>
          ),
        },
        {
          Header: 'Public Holidays',
          accessor: (x: WeeklyWorkingHours) => {
            return x.publicHolidaysTime ? (
              <span title={x.publicHolidayEntries} className="cursor-help">
                {getDurationString(x.publicHolidaysTime)}
              </span>
            ) : (
              <span className="text-gray-300">–</span>
            )
          },
        },
        showEntries && {
          Header: 'Public Holidays Entries',
          accessor: (x: WeeklyWorkingHours) => (
            <div className="whitespace-pre">{x.publicHolidayEntries}</div>
          ),
        },
      ].filter(Boolean),
    [showEntries]
  )

  const monthLabel = React.useMemo(
    () => getPeriodLabel('month', offset),
    [offset]
  )

  const onNavigate = React.useCallback(
    (direction: -1 | 1) => () => setOffset((x) => x + direction),
    [offset]
  )

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-x-2 rounded-tiny',
          '-mx-4 sm:-mx-6 px-4 py-2 mb-4 sm:px-6 sm:py-4',
          'bg-fill-6/[0.025]'
        )}
      >
        <div className="flex-1 flex items-center h-12">
          <div className="flex gap-x-2 mr-4">
            <RoundButton onClick={onNavigate(-1)} icon="ArrowBack" />
            <RoundButton onClick={onNavigate(1)} icon="ArrowForward" />
          </div>
          <H2 className="m-0 my-2 font-primary font-medium">
            {startOfMonth.format('MMMM YYYY')}
          </H2>
          <div className="hidden sm:block ml-3 font-primary text-base text-text-tertiary whitespace-nowrap">
            {monthLabel}
          </div>
        </div>
      </div>
      <div className="rounded-tiny bg-bg-primary flex flex-col gap-y-4 mb-4">
        {/* <div>Agreed working week: {moduleConfig.weeklyWorkingHours}h</div> */}
        <div>
          <Input
            name="show_entries"
            type="checkbox"
            checked={showEntries}
            onChange={(v) => setShowEntries(Boolean(v))}
            inlineLabel="Show more details"
          />
        </div>
        <div className="-mx-6 sm:-mx-8">
          <Table
            columns={columns}
            data={weeks}
            paddingClassName="px-6 sm:px-8"
          />
        </div>
        <div className="mt-8">
          <div className="mb-4">
            Total for {startOfMonth.format('MMMM YYYY')}
          </div>
          <div className="-mx-6 sm:-mx-8">
            <Table
              columns={[
                {
                  Header: 'Working hours',
                  accessor: () =>
                    totalPerMonth.workingHours
                      ? getDurationString(totalPerMonth.workingHours)
                      : '–',
                },
                {
                  Header: 'Additional hours',
                  accessor: () =>
                    totalPerMonth.overworkTime
                      ? getDurationString(totalPerMonth.overworkTime)
                      : '–',
                },
                {
                  Header: 'Time Off',
                  accessor: () =>
                    totalPerMonth.timeOffTime
                      ? getDurationString(totalPerMonth.timeOffTime)
                      : '–',
                },
                {
                  Header: 'Public Holidays',
                  accessor: () =>
                    totalPerMonth.publicHolidaysTime
                      ? getDurationString(totalPerMonth.publicHolidaysTime)
                      : '–',
                },
              ]}
              data={[totalPerMonth]}
              paddingClassName="px-6 sm:px-8"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
