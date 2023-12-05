import { useStore } from '@nanostores/react'
import dayjs, { Dayjs } from 'dayjs'
import * as React from 'react'
import { PermissionsValidator } from '#client/components/PermissionsValidator'
import { Button, Input, Link, Table } from '#client/components/ui'
import { DATE_FORMAT } from '#client/constants'
import Permissions from '#shared/permissions'
import * as stores from '#client/stores'
import { VisitsDailyStats } from '#shared/types'
import { cn, toggleInArray } from '#client/utils'
import { useVisitsStatsAdmin } from '../queries'

export const VisitsStats = () => (
  <PermissionsValidator required={[Permissions['office-visits'].AdminList]}>
    <_VisitsStats />
  </PermissionsValidator>
)

const _VisitsStats: React.FC = () => {
  const officeId = useStore(stores.officeId)
  const [isShown, setIsShown] = React.useState(false)
  const [period, setPeriod] = React.useState<{ from: Dayjs; to: Dayjs }>({
    from: dayjs().startOf('month'),
    to: dayjs().endOf('month'),
  })
  const [expandedDates, setExpandedDates] = React.useState<string[]>([])

  const csvExportPath = React.useMemo(
    () =>
      `/admin-api/office-visits/stats?format=csv&from=${period.from.format(
        DATE_FORMAT
      )}&to=${period.to.format(DATE_FORMAT)}&office=${officeId}`,
    [period, officeId]
  )

  const { data = [] } = useVisitsStatsAdmin(
    officeId,
    [period.from.format(DATE_FORMAT), period.to.format(DATE_FORMAT)],
    { enabled: isShown && period.from.isValid() && period.to.isValid() }
  )

  const onToggleDepartmentStats = React.useCallback(
    (date: string) => (ev: React.MouseEvent) => {
      setExpandedDates((dates) => toggleInArray(dates, date))
    },
    []
  )

  const columns = React.useMemo(
    () => [
      {
        id: 'date',
        Header: 'Date',
        accessor: (x: VisitsDailyStats) => (
          <span className={cn(!x.existingVisitsNumber && 'text-gray-400')}>
            {dayjs(x.date, DATE_FORMAT).format('D MMMM, YYYY')}
          </span>
        ),
      },
      {
        id: 'visits',
        Header: 'Confirmed visits',
        accessor: (x: VisitsDailyStats) => {
          const isExpanded = expandedDates.includes(x.date)
          return (
            <div className={cn(!x.existingVisitsNumber && 'text-gray-400')}>
              <div className="flex">
                <div className="flex-1">{x.existingVisitsNumber}</div>
                {!!x.existingVisitsNumber && (
                  <Button
                    className="ml-2"
                    size="small"
                    kind="secondary"
                    onClick={onToggleDepartmentStats(x.date)}
                  >
                    {isExpanded ? 'Less' : 'More'} info
                  </Button>
                )}
              </div>
              {isExpanded && (
                <div className="mt-2">
                  {x.occupancyPercentByDepartment.map((d) => (
                    <div key={d.department}>
                      {d.department} –{' '}
                      {Number((d.occupancyPercent * 100).toFixed(1))}%
                    </div>
                  ))}
                  {!!x.guests.length && (
                    <div className="mt-2">
                      Guests:{' '}
                      {x.guests.map((g, i) => (
                        <span key={g.fullName}>
                          {!!i && ', '}
                          <Link href={`mailto:${g.email}`}>{g.fullName}</Link>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        },
      },
      {
        id: 'occupancy',
        Header: 'Occupancy',
        accessor: (x: VisitsDailyStats) => (
          <span className={cn(!x.occupancyPercent && 'text-gray-400')}>
            {Number((x.occupancyPercent * 100).toFixed(1))}%
          </span>
        ),
      },
    ],
    [expandedDates]
  )

  React.useEffect(() => setExpandedDates([]), [period])

  const onDateChange = React.useCallback(
    (field: 'from' | 'to') => (date: string | boolean) => {
      setPeriod((value) => ({
        ...value,
        [field]: dayjs(String(date), DATE_FORMAT),
      }))
    },
    []
  )

  return (
    <div>
      {!isShown ? (
        <Button size="small" onClick={() => setIsShown(true)}>
          Show stats
        </Button>
      ) : (
        <div>
          <Button size="small" onClick={() => setIsShown(false)}>
            Hide stats
          </Button>
          <div className="my-8">
            <div className="md:flex items-center mb-4">
              <div className="flex-1 sm:flex items-center">
                <div className="mr-4 hidden sm:block">Period:</div>
                <Input
                  type="date"
                  value={period.from.format(DATE_FORMAT)}
                  containerClassName="inline-flex mr-2 mb-2 sm:mb-0"
                  onChange={onDateChange('from')}
                />
                <Input
                  type="date"
                  value={period.to.format(DATE_FORMAT)}
                  onChange={onDateChange('to')}
                  containerClassName="inline-flex mb-2 sm:mb-0"
                />
              </div>
              <div>
                <Button href={csvExportPath} rel="external" size="small">
                  Export CSV
                </Button>
              </div>
            </div>

            {data.length ? (
              <div className="-mx-8">
                <Table columns={columns} data={data} />
              </div>
            ) : (
              <div className="text-center my-6 text-gray-400">No data</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
