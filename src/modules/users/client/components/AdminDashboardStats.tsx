import React from 'react'
import dayjs, { Dayjs } from 'dayjs'
import dayjsIsSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import dayjsIsSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import { StackedBarChart, Card } from '#client/components/charts'
import { DATE_FORMAT } from '#client/constants'
import * as fp from '#shared/utils/fp'
import { Placeholder, WidgetWrapper } from '#client/components/ui'
import { UsersAdminDashboardStats } from '#shared/types'
import { useAdminDashboardStats } from '../queries'

dayjs.extend(dayjsIsSameOrBefore)
dayjs.extend(dayjsIsSameOrAfter)

type Props = {
  period: [Dayjs, Dayjs]
  unit: 'week' | 'month' | 'year'
}

type DailyData = UsersAdminDashboardStats['registeredByDate']
type DailyDatum = UsersAdminDashboardStats['registeredByDate'][0]

export const AdminDashboardStats: React.FC<Props> = ({ period, unit }) => {
  const { data, isFetched } = useAdminDashboardStats(
    period[0].format(DATE_FORMAT),
    period[1].format(DATE_FORMAT)
  )

  const noData = React.useMemo(() => {
    return !!data && !data.registeredByDate.length
  }, [data])

  const roles = React.useMemo(() => {
    if (!data) return []
    return data.roles || []
  }, [data])

  const dailyData = React.useMemo(() => {
    if (!data || !data.registeredByDate.length) return []
    const dateFormat = unit === 'year' ? 'YYYY-MM' : 'YYYY-MM-DD'
    const result: DailyData = []
    const start = dayjs(period[0])
    const end = dayjs(period[1])
    const byDate = data.registeredByDate.reduce<Record<string, DailyDatum>>(
      fp.by('date'),
      {}
    )
    const roles = data.roles || []
    let date = start
    while (date <= end) {
      const initialDatum = byDate[date.format(dateFormat)]
      const datum = {
        date: date.format(dateFormat),
        total: initialDatum?.total || 0,
      }
      roles.forEach((role) => {
        datum[role.id] = Number(initialDatum?.[role.id]) || 0
      })
      result.push(datum)
      date = date.add(1, unit === 'year' ? 'month' : 'day')
    }
    return result
  }, [data, period, unit])

  const xTickFormat = React.useMemo(() => {
    switch (unit) {
      case 'week':
        return (date: string) => dayjs(date, DATE_FORMAT).format('D MMM')
      case 'month':
        return (date: string) => dayjs(date, DATE_FORMAT).format('D')
      case 'year':
        return (date: string) => dayjs(date, 'YYYY-MM').format('MMM')
    }
  }, [unit])

  const barTitle = React.useMemo(() => {
    const getDatumSummary = (d: DailyDatum) => {
      return [`Total: ${d.total}`]
        .concat(
          roles.filter((x) => !!d[x.id]).map((x) => `${x.name}: ${d[x.id]}`)
        )
        .join('\n')
    }

    switch (unit) {
      case 'year':
        return (d: DailyDatum) =>
          `${dayjs(d.date, 'YYYY-MM').format('MMMM YYYY')}\n\n${getDatumSummary(
            d
          )}`
      default:
        return (d: DailyDatum) =>
          `${dayjs(d.date, DATE_FORMAT).format(
            'D MMMM YYYY'
          )}\n\n${getDatumSummary(d)}`
    }
  }, [unit, roles])

  const legendItem = React.useMemo(
    () => (key: string) => {
      const role = roles.find((x) => x.id === key)
      return role ? role.name : key
    },
    [roles]
  )

  if (!isFetched || !data) {
    return (
      <WidgetWrapper title="Users">
        <Placeholder children="Loading..." />
      </WidgetWrapper>
    )
  }

  if (noData) {
    return (
      <WidgetWrapper title="Users">
        <Placeholder children="No data" />
      </WidgetWrapper>
    )
  }

  return (
    <WidgetWrapper title="Users">
      <div className="flex gap-x-2 mb-4 overflow-x-scroll">
        <Card
          title={data.registeredToday}
          subtitle={'Registered users today'}
        />
        <Card title={data.registeredTotal} subtitle={'Registered users'} />
      </div>

      {!!dailyData.length ? (
        <StackedBarChart
          xKey="date"
          yKeys={roles.map(fp.prop('id'))}
          data={dailyData}
          xTickFormat={xTickFormat}
          barTitle={barTitle}
          legendItem={legendItem}
        />
      ) : (
        'No data'
      )}
    </WidgetWrapper>
  )
}
