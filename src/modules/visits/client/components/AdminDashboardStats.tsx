import React from 'react'
import { useStore } from '@nanostores/react'
import dayjs, { Dayjs } from 'dayjs'
import dayjsIsSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import dayjsIsSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import { StackedBarChart, YearCalendar, Card } from '#client/components/charts'
import { DATE_FORMAT } from '#client/constants'
import * as stores from '#client/stores'
import * as fp from '#shared/utils/fp'
import { H2, HR, Placeholder, Table, UserLabel, WidgetWrapper } from '#client/components/ui'
import { VisitsAdminDashboardStats } from '#shared/types'
import { useAdminDashboardStats } from '../queries'

dayjs.extend(dayjsIsSameOrBefore)
dayjs.extend(dayjsIsSameOrAfter)

type Props = {
  period: [Dayjs, Dayjs]
  unit: 'week' | 'month' | 'year'
}

type DailyData = VisitsAdminDashboardStats['visitsByDate']
type DailyDatum = VisitsAdminDashboardStats['visitsByDate'][0]

export const AdminDashboardStats: React.FC<Props> = ({ period, unit }) => {
  const officeId = useStore(stores.officeId)
  const { data, isFetched } = useAdminDashboardStats(
    period[0].format(DATE_FORMAT),
    period[1].format(DATE_FORMAT),
    officeId
  )

  const noData = React.useMemo(() => {
    return !!data && !data.visitsByDate.length
  }, [data])

  const areas = React.useMemo(() => data?.areas || [], [data])

  const dailyData = React.useMemo(() => {
    if (!data || !data.visitsByDate.length) return []
    const dateFormat = unit === 'year' ? 'YYYY-MM' : 'YYYY-MM-DD'
    const result: DailyData = []
    const start = dayjs(period[0])
    const end = dayjs(period[1])
    const byDate = data.visitsByDate.reduce<Record<string, DailyDatum>>(
      fp.by('date'),
      {}
    )
    const areas = data.areas || []
    let date = start
    while (date <= end) {
      const initialDatum = byDate[date.format(dateFormat)]
      const datum = {
        date: date.format(dateFormat),
        total: initialDatum?.total || 0,
      }
      areas.forEach((area) => {
        datum[area.id] = Number(initialDatum?.[area.id]) || 0
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
          areas.filter((x) => !!d[x.id]).map((x) => `${x.name}: ${d[x.id]}`)
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
  }, [unit, areas])

  const legendItem = React.useMemo(
    () => (key: string) => {
      const role = areas.find((x) => x.id === key)
      return role ? role.name : key
    },
    [areas]
  )

  const annualVisits = React.useMemo(() => {
    if (!data) return []
    type AnnualVisitsDatum = VisitsAdminDashboardStats['annualVisits'][0]
    if (unit !== 'year') return []
    const result: { date: string; value: number }[] = []
    const start = dayjs(period[0])
    const end = dayjs(period[1])
    const byDate = data?.annualVisits.reduce<Record<string, AnnualVisitsDatum>>(
      fp.by('date'),
      {}
    )
    let date = start
    while (date <= end) {
      const initialDatum = byDate[date.format(DATE_FORMAT)]
      result.push({
        date: date.format(DATE_FORMAT),
        value: initialDatum?.visits || 0,
      })
      date = date.add(1, 'day')
    }
    return result
  }, [data, unit, period])

  if (!isFetched || !data) {
    return (
      <WidgetWrapper title="Office occupancy">
        <Placeholder children="Loading..." />
      </WidgetWrapper>
    )
  }

  if (noData) {
    return (
      <WidgetWrapper title="Office occupancy">
        <Placeholder children="No data" />
      </WidgetWrapper>
    )
  }

  return (
    <WidgetWrapper title="Office occupancy">
      <div className="flex gap-x-2 mb-4 overflow-x-scroll">
        <Card
          title={data.visitsToday}
          subtitle={'Visits today'}
        />
        <Card
          title={data.visitsTotal}
          subtitle={'Total visits'}
        />
      </div>
      <StackedBarChart
        xKey="date"
        yKeys={areas.map(fp.prop('id'))}
        data={dailyData}
        xTickFormat={xTickFormat}
        barTitle={barTitle}
        legendItem={legendItem}
      />

      <HR className="my-8" />

      <div className="flex gap-x-4">
        <div className="flex-1">
          <H2>Top visitors</H2>
          <Table
            paddingClassName="px-0"
            columns={[
              {
                Header: 'User',
                accessor: (x) => (
                  <UserLabel
                    user={{
                      isInitialised: true,
                      id: x.userId,
                      fullName: x.fullName,
                      avatar: x.avatar,
                    }}
                  />
                ),
              },
              { Header: 'Visits', accessor: (x) => String(x.visits) },
            ]}
            data={data.topVisitors}
          />
        </div>
        <div className="flex-1">
          <H2>Top desks</H2>
          <Table
            paddingClassName="px-0"
            columns={[
              {
                Header: 'Desk',
                accessor: (x) => `${x.areaName}, ${x.deskName}`,
              },
              { Header: 'Visits', accessor: (x) => String(x.visits) },
            ]}
            data={data.topDesks}
          />
        </div>
      </div>

      <HR className="my-8" />

      <H2>Annual occupancy</H2>
      <div className="flex justify-center">
        <YearCalendar data={annualVisits} />
      </div>
    </WidgetWrapper>
  )
}
