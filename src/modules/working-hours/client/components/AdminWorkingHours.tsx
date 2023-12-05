import * as React from 'react'
import dayjs, { Dayjs } from 'dayjs'
import {
  Button,
  H1,
  Icons,
  RoundButton,
  Select,
  Table,
  Tag,
  UserLabel,
} from '#client/components/ui'
import { by, groupBy, propEq, sortBy } from '#shared/utils/fp'
import { formatDateRange } from '#client/utils'
import { DATE_FORMAT } from '#client/constants'
import { useUsersCompact } from '#modules/users/client/queries'
import {
  useAdminEntries,
  useAdminConfig,
  useAdminTimeOffRequests,
  useAdminUserConfigs,
} from '../queries'
import {
  calculateTotalWorkingHours,
  getDurationString,
  getExactHours,
  calculateOverwork,
  calculateTotalTimeOffTime,
  sumTime,
} from '../../shared-helpers'
import { TimeOffRequest, UserCompact, WorkingHoursEntry } from '#shared/types'
import { WorkingHoursUserModal } from './WorkingHoursUserModal'
import { WorkingHoursExportModal } from './WorkingHoursExportModal'

enum QueryParams {
  User = 'userId',
  Offset = 'offset',
  Unit = 'unit',
}

type UserWorkingHours = {
  user: UserCompact
  workingHours: [number, number] | null
  workingHoursExact: number
  overworkLevel: 'gray' | 'yellow' | 'red' | null
  overworkTime: [number, number] | null
  timeOffTime: [number, number] | null
  weeklyWorkingHours: number
}

type Unit = 'week' | 'month'

export const AdminWorkingHours: React.FC = () => {
  const [offset, setOffset] = React.useState<number>(0)
  const [unit, setUnit] = React.useState<Unit>('week')
  const [division, setDivision] = React.useState<string>('')
  const [showExportModal, setShowExportModal] = React.useState(false)
  const [shownUser, setShownUser] = React.useState<UserCompact | null>(null)

  const period = React.useMemo<[Dayjs, Dayjs]>(() => {
    const start = dayjs()
      .startOf(unit === 'week' ? 'isoWeek' : unit)
      .add(offset, unit)
    const end = start.endOf(unit === 'week' ? 'isoWeek' : unit)
    return [start, end]
  }, [offset, unit])

  const { data: configByDivision = {} } = useAdminConfig()
  const { data: entries = [] } = useAdminEntries(
    period[0].format(DATE_FORMAT),
    period[1].format(DATE_FORMAT),
    null
  )
  const { data: timeOffRequests = [] } = useAdminTimeOffRequests(
    period[0].format(DATE_FORMAT),
    period[1].format(DATE_FORMAT),
    null
  )
  const { data: userConfigs = [] } = useAdminUserConfigs({
    division,
  })

  const userConfigByUserId = React.useMemo(
    () => userConfigs.reduce(by('userId'), {}),
    [userConfigs]
  )

  const divisions = React.useMemo(
    () => Object.keys(configByDivision),
    [configByDivision]
  )

  const moduleConfig = React.useMemo(
    () => (division ? configByDivision[division] : null),
    [configByDivision, division]
  )

  const { data: users = [] } = useUsersCompact(undefined, {
    enabled: true,
    retry: false,
  })
  const usersById = React.useMemo(
    () => (users || []).reduce(by('id'), {}),
    [users]
  )

  const entriesByUser = React.useMemo(
    () =>
      (entries || []).reduce(
        groupBy('userId'),
        {} as Record<string, WorkingHoursEntry[]>
      ),
    [entries]
  )

  const timeOffRequestsByUser = React.useMemo(
    () =>
      (timeOffRequests || []).reduce(
        groupBy('userId'),
        {} as Record<string, TimeOffRequest[]>
      ),
    [timeOffRequests]
  )

  const userWorkingHours = React.useMemo<UserWorkingHours[]>(() => {
    return users
      .filter((user) => user.division === division)
      .map((user) => {
        const workingHours = calculateTotalWorkingHours(
          entriesByUser[user.id] || []
        )
        const workingHoursExact = getExactHours(workingHours)
        const userConfig = userConfigByUserId[user.id]?.value
        const mergedModuleConfig = {
          ...(moduleConfig || {}),
          ...(userConfig || {}),
        } as typeof moduleConfig

        const timeOffTime = calculateTotalTimeOffTime(
          period,
          timeOffRequestsByUser[user.id] || [],
          mergedModuleConfig
        )

        const { time: overworkTime, level: overworkLevel } =
          moduleConfig && mergedModuleConfig
            ? calculateOverwork(
                sumTime(workingHours, timeOffTime),
                mergedModuleConfig
              )
            : { time: null, level: null }

        return {
          user,
          workingHours,
          workingHoursExact,
          overworkLevel,
          overworkTime,
          timeOffTime,
          weeklyWorkingHours: mergedModuleConfig?.weeklyWorkingHours!,
        }
      })
      .sort(sortBy('workingHoursExact', 'desc'))
  }, [
    entriesByUser,
    users,
    division,
    moduleConfig,
    unit,
    period,
    timeOffRequestsByUser,
    period,
    userConfigByUserId,
  ])

  const onNavigate = React.useCallback(
    (direction: -1 | 1) => () => setOffset((x) => x + direction),
    [offset]
  )

  const columns = React.useMemo(
    () =>
      [
        {
          Header: 'User',
          accessor: (x: UserWorkingHours) => {
            return <UserLabel user={x.user} hideRole />
          },
        },
        {
          Header: 'Division',
          accessor: (x: UserWorkingHours) =>
            x.user.division || <span className="text-gray-300">UNKNOWN</span>,
        },
        {
          Header: 'Working hours',
          accessor: (x: UserWorkingHours) => {
            return !!x.workingHours ? (
              <div>
                <div className="flex">
                  <div className="flex-1 flex gap-x-2">
                    {getDurationString(x.workingHours)}
                    {unit === 'week' &&
                      !!x.overworkLevel &&
                      !!x.overworkTime && (
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
        {
          Header: 'Time Off',
          accessor: (x: UserWorkingHours) => {
            return x.timeOffTime ? (
              <span>{getDurationString(x.timeOffTime)}</span>
            ) : (
              <span className="text-gray-300">–</span>
            )
          },
        },
        unit === 'week'
          ? {
              Header: 'Agreed working week',
              accessor: (x: UserWorkingHours) => {
                return <span>{x.weeklyWorkingHours}h</span>
              },
            }
          : null,
        {
          Header: 'Action',
          accessor: (x: UserWorkingHours) => (
            <div className="flex gap-x-2">
              <Button
                size="small"
                kind="secondary"
                onClick={() => setShownUser(x.user)}
              >
                More
              </Button>
              {!!x.user.email && (
                <Button
                  size="small"
                  kind="secondary"
                  href={`mailto:${x.user.email}`}
                >
                  Email
                </Button>
              )}
            </div>
          ),
        },
      ].filter(Boolean),
    [usersById, moduleConfig, unit]
  )

  React.useEffect(() => {
    if (divisions.length) {
      setDivision(divisions[0])
    }
  }, [divisions])

  const isQueryParamsHandled = React.useRef<boolean>(false)

  React.useEffect(() => {
    const url = new URL(window.location.href)
    const userId = url.searchParams.get(QueryParams.User)
    if (shownUser && !userId) {
      url.searchParams.set(QueryParams.User, shownUser.id)
    } else if (!shownUser && userId && isQueryParamsHandled.current) {
      url.searchParams.delete(QueryParams.User)
    }
    window.history.replaceState(null, document.title, url.toString())
  }, [shownUser])

  React.useEffect(() => {
    if (!isQueryParamsHandled.current) return
    const url = new URL(window.location.href)
    url.searchParams.set(QueryParams.Unit, unit)
    window.history.replaceState(null, document.title, url.toString())
  }, [unit])

  React.useEffect(() => {
    if (!isQueryParamsHandled.current) return
    const url = new URL(window.location.href)
    url.searchParams.set(QueryParams.Offset, String(offset))
    window.history.replaceState(null, document.title, url.toString())
  }, [offset])

  React.useEffect(() => {
    if (users?.length && !isQueryParamsHandled.current) {
      isQueryParamsHandled.current = true
      const url = new URL(window.location.href)
      const userId = url.searchParams.get(QueryParams.User)
      if (userId) {
        const user = users.find(propEq('id', userId))
        if (user) setShownUser(user)
      }
      const offset = parseInt(
        String(url.searchParams.get(QueryParams.Offset)),
        10
      )
      if (offset && !isNaN(offset)) {
        setOffset(offset)
      }
      const unit = url.searchParams.get(QueryParams.Unit) || ''
      if (['week', 'month'].includes(unit)) {
        setUnit(unit as Unit)
      }
    }
  }, [users])

  return (
    <div>
      <div className="flex items-center mb-6">
        <H1 className="flex-1 mb-0">Working Hours</H1>
        <div>
          <Button
            size="small"
            kind="secondary"
            onClick={() => setShowExportModal(true)}
            rel="external"
          >
            CSV Export
          </Button>
        </div>
      </div>

      <div className="flex lg:items-center mb-4 gap-4 flex-col lg:flex-row">
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
            ]}
            value={unit}
            onChange={(value) => {
              setOffset(0)
              setUnit(value as Unit)
            }}
            containerClassName="mr-2"
          />

          {/* division picker */}
          <Select
            className="py-[5px]"
            options={divisions.map((x) => ({ value: x, label: x }))}
            value={division}
            onChange={(value) => {
              setOffset(0)
              setDivision(value)
            }}
          />
        </div>

        {/* date */}
        <div className="flex-1">
          {unit === 'week'
            ? formatDateRange(period[0], period[1])
            : period[0].format('MMMM, YYYY')}
          <span className="text-text-tertiary ml-4">
            {offset > 1 && `In ${Math.abs(offset)} ${unit}s`}
            {offset === 1 && `Next ${unit}`}
            {offset === 0 && `Current ${unit}`}
            {offset === -1 && `Previous ${unit}`}
            {offset < -1 && `${Math.abs(offset)} ${unit}s ago`}
          </span>
        </div>
      </div>

      {userWorkingHours.length ? (
        <div className="-mx-8">
          <Table columns={columns} data={userWorkingHours} />
        </div>
      ) : (
        <div className="text-gray-400 text-center my-12">No data</div>
      )}

      {showExportModal && (
        <WorkingHoursExportModal
          onClose={() => setShowExportModal(false)}
          divisions={divisions}
          defaultPeriod={period}
        />
      )}

      {!!shownUser && moduleConfig && (
        <WorkingHoursUserModal
          user={shownUser}
          onClose={() => setShownUser(null)}
          moduleConfig={moduleConfig}
        />
      )}
    </div>
  )
}
