import React from 'react'
import { useExternalScript, useResizeObserver } from '#client/utils/hooks'
import { cn } from '#client/utils'

type Color =
  | 'green'
  | 'yellow'
  | 'red'
  | 'blue'
  | 'gray'
  | 'purple'
  | 'brown'
  | 'pink'
  | 'teal'
  | 'lime'

const COLORS: Record<Color, { faded: string; normal: string }> = {
  green: { faded: '#35d54860', normal: '#30d043' },
  yellow: { faded: '#FBBF2460', normal: '#F59E0B' },
  red: { faded: '#F8717160', normal: '#EF4444' },
  blue: { faded: '#60A5FA60', normal: '#3B82F6' },
  gray: { faded: '#9CA3AF60', normal: '#6B7280' },
  purple: { faded: '#A78BFA60', normal: '#8B5CF6' },
  brown: { faded: '#C39F4460', normal: '#A06401' },
  pink: { faded: '#FF84B860', normal: '#F9559A' },
  teal: { faded: '#3A9DAB60', normal: '#3A9DAB' },
  lime: { faded: '#E9F93960', normal: '#B0C000' },
}
const DEFAULT_HEIGHT = 400
const DEFAULT_COLORS = Object.keys(COLORS) as Color[]

export interface Props<XKey extends string, YKey extends string> {
  xKey: XKey
  yKeys: YKey[]
  colors?: Color[]
  data: Array<{ [key in XKey]: string } & Record<YKey, number>>
  height?: number
  barTitle?: (datum: Record<XKey | YKey, any>) => string
  xTickFormat?: (xKey: XKey) => string
  className?: string
  legendItem?: (key: YKey) => string
}

export const StackedBarChart = <X extends string, Y extends string>(
  props: Props<X, Y>
) => {
  const ref = React.useRef<HTMLDivElement>(null)

  const colors = React.useMemo(
    () => props.colors || DEFAULT_COLORS,
    [props.colors]
  )

  const data = React.useMemo(() => {
    return props.data
  }, [props.data])

  const render = React.useCallback(() => {
    const d3 = window.d3
    const container = ref.current
    if (!d3 || !container) return
    d3.select(ref.current).select('svg').remove()

    const margin = { top: 4, right: 14, bottom: 14, left: 24 }
    const width = ref.current.clientWidth - margin.left - margin.right
    const height = (props.height || DEFAULT_HEIGHT) - margin.top - margin.bottom
    const barPadding = 2
    const numberOfBars = data.length
    const totalPadding = barPadding * numberOfBars
    const rangeWidth = width - margin.left - margin.right - totalPadding
    const barWidth = rangeWidth / numberOfBars
    const barPaddingRelative = barPadding / barWidth

    const svg = d3
      .select(ref.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const subgroups = props.yKeys
    const xScale = d3
      .scaleBand(
        data.map((d) => d[props.xKey]),
        [margin.left, width - margin.right]
      )
      .paddingInner(barPaddingRelative)
    const yScale = d3.scaleLinear(
      [0, d3.max(data, (d) => sumValues(d, props.yKeys))],
      [height - margin.bottom, margin.top]
    )
    const xAxis = d3
      .axisBottom(xScale)
      .tickSizeOuter(0)
      .tickFormat((d) => {
        return props.xTickFormat ? props.xTickFormat(d) : d
      })
    const yAxis = d3.axisLeft(yScale)
    const stack = d3.stack().keys(subgroups)
    const stackedData = stack(data)

    const groups = svg
      .append('g')
      .selectAll('g')
      .data(stackedData)
      .join('g')
      .style('fill', (_, i) => {
        const colors = props.colors || DEFAULT_COLORS
        const colorId = colors[i % colors.length]
        return COLORS[colorId]?.faded
      })

    groups
      .selectAll('rect')
      .data((d) => d)
      .join('rect')
      .attr('x', (d) => xScale(d.data[props.xKey]))
      .attr('y', (d) => yScale(d[1]))
      .attr('height', (d) => yScale(d[0]) - yScale(d[1]))
      .attr('width', xScale.bandwidth())
      .append('title')
      .text((d) => {
        return props.barTitle ? props.barTitle(d.data) : d.data[props.xKey]
      })

    groups
      .selectAll('rect.main')
      .data((d) => d)
      .join('rect')
      .attr('x', (d) => xScale(d.data[props.xKey]))
      .attr('y', (d) => yScale(d[1]))
      .attr('height', 2)
      .attr('width', xScale.bandwidth())
      .style('fill', (d, i, nodes) => {
        const stackKey = d3.select(nodes[i].parentNode).datum().key
        const value = d.data[stackKey]
        if (!value) return 'transparent'
        const colorIndex = props.yKeys.indexOf(stackKey)
        const colors = props.colors || DEFAULT_COLORS
        const colorId = colors[colorIndex % colors.length]
        return COLORS[colorId].normal
      })

    const xAxisGroup = svg
      .append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(xAxis)
    xAxisGroup.selectAll('path, .tick line').attr('stroke', '#ccc')
    xAxisGroup.selectAll('text').attr('fill', '#888')

    const yAxisGroup = svg
      .append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(yAxis)
    yAxisGroup.selectAll('path, .tick line').attr('stroke', '#ccc')
    yAxisGroup.selectAll('text').attr('fill', '#888')
  }, [data, props])

  useExternalScript('https://cdn.jsdelivr.net/npm/d3@7', render)
  useResizeObserver(ref, render)

  return (
    <div>
      <div className={cn(props.className)} ref={ref} />
      {!!props.legendItem && (
        <div className="flex justify-center">
          <div className="flex justify-center max-w-[800px] gap-x-4 flex-wrap mt-4">
            {props.yKeys.map((key) => {
              const colorIndex = props.yKeys.indexOf(key)
              const colorId = colors[colorIndex % colors.length]
              const color = COLORS[colorId] || COLORS.gray
              return (
                <div key={key} className="flex items-center gap-x-1">
                  <div
                    className="w-3 h-3 border rounded-md"
                    style={{
                      backgroundColor: color.faded,
                      borderColor: color.normal,
                    }}
                  />
                  <span className="text-text-secondary">
                    {props.legendItem!(key)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function sumValues(datum: Record<string, number>, keys: string[]): number {
  return keys.reduce((sum, key) => sum + datum[key], 0)
}
