import React from 'react'
import { useStore } from '@nanostores/react'
import dayjs, { Dayjs } from 'dayjs'
import dayjsIsSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import dayjsIsSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import { StackedBarChart, Card } from '#client/components/charts'
import { DATE_FORMAT } from '#client/constants'
import * as stores from '#client/stores'
import * as fp from '#shared/utils/fp'
import { H2, HR, Placeholder, Table, UserLabel, WidgetWrapper } from '#client/components/ui'
import { RoomReservationAdminDashboardStats } from '#shared/types'
import { useAdminDashboardStats } from '../queries'

dayjs.extend(dayjsIsSameOrBefore)
dayjs.extend(dayjsIsSameOrAfter)

type Props = {
  period: [Dayjs, Dayjs]
  unit: 'week' | 'month' | 'year'
}

type DailyData = RoomReservationAdminDashboardStats['reservationsByDate']
type DailyDatum = RoomReservationAdminDashboardStats['reservationsByDate'][0]

export const AdminDashboardStats: React.FC<Props> = ({ period, unit }) => {
  const officeId = useStore(stores.officeId)
  const { data, isFetched } = useAdminDashboardStats(
    period[0].format(DATE_FORMAT),
    period[1].format(DATE_FORMAT),
    officeId
  )

  const noData = React.useMemo(() => {
    return !!data && !data.reservationsByDate.length
  }, [data])

  const dailyData = React.useMemo(() => {
    if (!data || !data.reservationsByDate.length) return []
    const dateFormat = unit === 'year' ? 'YYYY-MM' : 'YYYY-MM-DD'
    const result: DailyData = []
    const start = dayjs(period[0])
    const end = dayjs(period[1])
    const byDate = data.reservationsByDate.reduce<Record<string, DailyDatum>>(
      fp.by('date'),
      {}
    )
    let date = start
    while (date <= end) {
      const initialDatum = byDate[date.format(dateFormat)]
      result.push({
        date: date.format(dateFormat),
        total: initialDatum?.total || 0,
      })
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
    switch (unit) {
      case 'year':
        return (d: DailyDatum) =>
          `${dayjs(d.date, 'YYYY-MM').format('MMMM YYYY')}\n\nTotal: ${d.total}`
      default:
        return (d: DailyDatum) =>
          `${dayjs(d.date, DATE_FORMAT).format('D MMMM YYYY')}\n\nTotal: ${
            d.total
          }`
    }
  }, [unit])

  if (!isFetched || !data) {
    return (
      <WidgetWrapper title="Guest visits">
        <Placeholder children="Loading..." />
      </WidgetWrapper>
    )
  }

  if (noData) {
    return (
      <WidgetWrapper title="Guest visits">
        <Placeholder children="No data" />
      </WidgetWrapper>
    )
  }

  return (
    <WidgetWrapper title="Room reservations">
      <div className="flex gap-x-2 mb-4 overflow-x-scroll">
        <Card
          title={data.reservationsToday}
          subtitle={'Reservations today'}
        />
        <Card
          title={data.reservationsTotal}
          subtitle={'Total reservations'}
        />
        <Card
          title={data.anonymouseReservationsPercent + '%'}
          subtitle={'Anonymous reservations'}
        />
        <Card
          title={data.bookersToday}
          subtitle={'Bookers today'}
        />
        <Card
          title={data.bookersTotal}
          subtitle={'Bookers total'}
        />
      </div>
      <StackedBarChart
        xKey="date"
        yKeys={['total']}
        data={dailyData}
        xTickFormat={xTickFormat}
        barTitle={barTitle}
      />

      <HR className="my-8" />

      <div className="flex gap-x-2">
        <div className="flex-1">
          <H2>Top bookers</H2>
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
              {
                Header: 'Reservations',
                accessor: (x) => String(x.reservations),
              },
            ]}
            data={data.topBookers}
          />
        </div>
        <div className="flex-1" />
      </div>
    </WidgetWrapper>
  )
}
