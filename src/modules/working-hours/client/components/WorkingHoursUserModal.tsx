import * as React from 'react'
import dayjs from 'dayjs'
import dayjsIsoWeek from 'dayjs/plugin/isoWeek'
import dayjsAdvancedFormat from 'dayjs/plugin/advancedFormat'
import {
  Modal,
  Input,
  Table,
  Tag,
  UserLabel,
  Button,
} from '#client/components/ui'
import { formatDateRange } from '#client/utils'
import { DATE_FORMAT } from '#client/constants'
import {
  PublicHoliday,
  UserCompact,
  WorkingHoursConfig,
  WorkingHoursEntry,
} from '#shared/types'
import * as fp from '#shared/utils/fp'
import {
  useAdminEntries,
  useAdminPublicHolidays,
  useAdminTimeOffRequests,
  useAdminUserConfigs,
} from '../queries'
import {
  calculateTotalWorkingHours,
  getDurationString,
  calculateOverwork,
  OverworkLevel,
  calculateTotalTimeOffTime,
  getTimeOffByDate,
  sumTime,
  getIntervalDates,
  getWeekIndexesRange,
  calculateTotalPublicHolidaysTime,
} from '../../shared-helpers'

dayjs.extend(dayjsIsoWeek)
dayjs.extend(dayjsAdvancedFormat)

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

export const WorkingHoursUserModal: React.FC<{
  onClose: () => void
  user: UserCompact
  moduleConfig: WorkingHoursConfig
}> = ({ user, moduleConfig, onClose }) => {
  const [showEntries, setShowEntries] = React.useState(false)
  const { data: entries = [] } = useAdminEntries(null, null, user.id)
  const { data: timeOffRequests = [] } = useAdminTimeOffRequests(
    null,
    null,
    user.id
  )
  const { data: publicHolidays = [] } = useAdminPublicHolidays(
    null,
    null,
    moduleConfig?.publicHolidayCalendarId || null,
    { enabled: !!moduleConfig.publicHolidayCalendarId }
  )
  const { data: userConfigs = [] } = useAdminUserConfigs({
    userId: user.id,
  })

  const userConfig = React.useMemo(() => userConfigs[0] || null, [userConfigs])
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
      ...entries.map(fp.prop('date')),
      ...timeOffRequests.map(fp.prop('dates')).flat(),
    ])
  }, [entries, timeOffRequests])

  const mergedModuleConfig = React.useMemo<WorkingHoursConfig>(
    () => ({
      ...moduleConfig,
      ...(userConfig?.value || {}),
    }),
    [userConfig, moduleConfig]
  )

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
        mergedModuleConfig
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
        mergedModuleConfig
      )
      const publicHolidayEntries = publicHolidays
        .map((x) => `${dayjs(x.date, DATE_FORMAT).format('D MMMM')}: ${x.name}`)
        .join('\n')

      const { time: overworkTime, level: overworkLevel } = calculateOverwork(
        sumTime(totalWorkingHours, timeOffTime, publicHolidaysTime),
        mergedModuleConfig
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
    showEntries,
    mergedModuleConfig,
  ])

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
                        Overwork {getDurationString(x.overworkTime)}
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

  if (!user) return null
  return (
    <Modal onClose={onClose} title="User working hours" size="wide">
      <div className="flex flex-col gap-y-6">
        <UserLabel user={user} />
        <div>Agreed working week: {mergedModuleConfig.weeklyWorkingHours}h</div>
        <div className="flex">
          <div className="flex-1">
            <Input
              name="show_entries"
              type="checkbox"
              checked={showEntries}
              onChange={(v) => setShowEntries(Boolean(v))}
              inlineLabel="Show More Details"
            />
          </div>
          <div>
            <Button
              kind="secondary"
              href={`/admin-api/working-hours/export/user/${user.id}`}
              size="small"
              rel="external"
            >
              CSV Export
            </Button>
          </div>
        </div>
        <div className="-mx-6 sm:-mx-8">
          <Table
            columns={columns}
            data={weeks}
            paddingClassName="px-6 sm:px-8"
          />
        </div>
      </div>
    </Modal>
  )
}
