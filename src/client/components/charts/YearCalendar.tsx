import React from 'react'
import dayjs from 'dayjs'
import { useExternalScript } from '#client/utils/hooks'
import { cn } from '#client/utils'

export type Props = {
  data: Array<{ date: string; value: number }>
  className?: string
}

export const YearCalendar: React.FC<Props> = (props) => {
  const ref = React.useRef<HTMLDivElement>(null)

  const render = React.useCallback(() => {
    const d3 = window.d3
    if (!d3 || !ref.current) return
    d3.select(ref.current).select('svg').remove()

    const width = 960
    const cellSize = 17
    const height = cellSize * 9

    const formatDay = (i: number) => 'SMTWTFS'[i]
    const formatMonth = d3.utcFormat('%b')
    const timeWeek = d3.utcMonday
    const countDay = (i: number) => (i + 6) % 7

    const chartData = props.data.map((d) => ({
      date: new Date(d.date),
      value: d.value,
    }))

    const color = d3
      .scaleSequential(d3.interpolateRgb('white', '#23B434'))
      .domain([-1, d3.max(chartData, (d) => d.value)])

    const years = d3.groups(chartData, (d) => d.date.getUTCFullYear()).reverse()

    const svg = d3
      .select(ref.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height * years.length)
      .attr('viewBox', [0, 0, width, height * years.length])
      .attr('style', 'font: 10px sans-serif;')

    const year = svg
      .selectAll('g')
      .data(years)
      .join('g')
      .attr(
        'transform',
        (d, i) => `translate(40.5,${height * i + cellSize * 1.5})`
      )

    year
      .append('text')
      .attr('x', -5)
      .attr('y', -5)
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'end')
      .text(([key]) => key)

    year
      .append('g')
      .attr('text-anchor', 'end')
      .selectAll()
      .data(d3.range(0, 7))
      .join('text')
      .attr('x', -5)
      .attr('y', (i) => (countDay(i) + 0.5) * cellSize)
      .attr('dy', '0.31em')
      .text(formatDay)

    year
      .append('g')
      .selectAll()
      .data(([, values]) => values)
      .join('rect')
      .attr('rx', 2)
      .attr('width', cellSize - 3)
      .attr('height', cellSize - 3)
      .attr(
        'x',
        (d) => timeWeek.count(d3.utcYear(d.date), d.date) * cellSize + 0.5
      )
      .attr('y', (d) => countDay(d.date.getUTCDay()) * cellSize + 0.5)
      .attr('fill', (d) => {
        if (d.value === 0) return '#f0f0f0'
        return color(d.value)
      })
      .append('title')
      .text((d) => `${dayjs(d.date).format('D MMM YYYY')}\n${d.value}`)

    const month = year
      .append('g')
      .selectAll()
      .data(([, values]) =>
        d3.utcMonths(d3.utcMonth(values[0].date), values.at(-1)!.date)
      )
      .join('g')

    month
      .append('text')
      .attr(
        'x',
        (d) => timeWeek.count(d3.utcYear(d), timeWeek.ceil(d)) * cellSize + 2
      )
      .attr('y', -5)
      .text(formatMonth)
  }, [props.data])

  useExternalScript('https://cdn.jsdelivr.net/npm/d3@7', render)

  return <div className={cn('overflow-x-scroll', props.className)} ref={ref} />
}
