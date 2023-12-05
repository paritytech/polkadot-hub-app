import * as React from 'react'
import dayjs from 'dayjs'
import dayjsIsoWeek from 'dayjs/plugin/isoWeek'
import {
  Modal,
  Input,
  Table,
  Tag,
  UserLabel,
  Button,
} from '#client/components/ui'
import { groupBy, omit, sortWith } from '#shared/utils/fp'
import { formatDateRange } from '#client/utils'
import { DATE_FORMAT } from '#client/constants'
import { UserCompact, WorkingHoursConfig } from '#shared/types'
import * as fp from '#shared/utils/fp'
import {
  useAdminEntries,
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
} from '../../shared-helpers'

dayjs.extend(dayjsIsoWeek)

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
}

type TimeOffRef = { weekIndex: number; userId: string; id: string }

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
          weekIndex: dayjs(d, DATE_FORMAT).isoWeek(),
          userId: x.userId,
          id: String(x.id),
        }))
      )
      .flat()
    return timeOffRefs.reduce(fp.groupBy('weekIndex'), {})
  }, [timeOffRequests])

  const mergedModuleConfig = React.useMemo<WorkingHoursConfig>(
    () => ({
      ...moduleConfig,
      ...(userConfig?.value || {}),
    }),
    [userConfig, moduleConfig]
  )

  const weeks = React.useMemo<WeeklyWorkingHours[]>(() => {
    const currentWeekIndex = dayjs().isoWeek()
    const indexedEntries = entries.map((x) => ({
      ...x,
      weekIndex: dayjs(x.date, DATE_FORMAT).isoWeek().toString(),
    }))
    const groupedByWeekIndex = indexedEntries.reduce(groupBy('weekIndex'), {})
    const weekIndexes = Object.keys(groupedByWeekIndex).sort(
      sortWith(Number, 'desc')
    )
    return weekIndexes.map((weekIndex) => {
      const startOfWeek = dayjs().startOf('isoWeek').isoWeek(Number(weekIndex))
      const endOfWeek = startOfWeek.endOf('isoWeek')
      const weekLabel =
        currentWeekIndex === Number(weekIndex) ? 'Current' : null
      const entriesGroupedByDay = groupedByWeekIndex[weekIndex]
        .map(omit(['weekIndex']))
        .reduce(groupBy('date'), {})
      const days = Object.keys(entriesGroupedByDay).sort(
        sortWith((x) => dayjs(x, DATE_FORMAT).unix(), 'asc')
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
        groupedByWeekIndex[weekIndex]
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
      const timeOffEntries = Object.keys(timeOffByDate)
        .reduce<string[]>((acc, date) => {
          const entry = timeOffByDate[date]
          return [
            ...acc,
            `${dayjs(date, DATE_FORMAT).format('D MMMM')}: ${entry.value} ${
              entry.unit
            }(s)`,
          ]
        }, [])
        .join('\n')

      const { time: overworkTime, level: overworkLevel } = calculateOverwork(
        sumTime(totalWorkingHours, timeOffTime),
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
      }
    })
  }, [entries, showEntries, timeOffRequests, mergedModuleConfig])

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
      ].filter(Boolean),
    [showEntries]
  )

  if (!user) return null
  return (
    <Modal onClose={onClose} title="User working hours" size="wide">
      <div className="flex flex-col gap-y-6">
        <UserLabel user={user} hideRole />
        <div>Agreed working week: {mergedModuleConfig.weeklyWorkingHours}h</div>
        <div className="flex">
          <div className="flex-1">
            <Input
              name="show_entries"
              type="checkbox"
              checked={showEntries}
              onChange={(v) => setShowEntries(Boolean(v))}
              inlineLabel="Verbose"
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
