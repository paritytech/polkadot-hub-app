import dayjs, { Dayjs } from 'dayjs'
import React, { useEffect } from 'react'
import { P, RoundButton } from '.'
import { cn } from '#client/utils'

export const DaySlider = ({
  reverse = false,
  slideDate,
  onChange,
}: {
  reverse?: boolean
  slideDate?: string
  onChange: (v: Dayjs) => void
}) => {
  const [dayOffset, setDayOffset] = React.useState<number>(0)
  const date = React.useMemo(
    () => dayjs().startOf('day').add(dayOffset, 'day'),
    [dayOffset]
  )
  const dateLabel = React.useMemo(() => {
    if (dayOffset === 0) {
      return 'Today'
    }
    if (dayOffset === 1) {
      return 'Tomorrow'
    }
    return dayjs(date).format('dddd')
  }, [dayOffset])

  useEffect(() => {
    onChange(date)
  }, [date])

  useEffect(() => {
    setDayOffset(dayjs(slideDate).diff(dayjs().startOf('day'), 'day'))
  }, [slideDate])

  const onChangeDayOffset = React.useCallback(
    (direction: -1 | 1) => (ev: React.MouseEvent) => {
      ev.preventDefault()
      setDayOffset((value) => {
        if (!value && direction === -1) return value
        return direction === -1 ? value - 1 : value + 1
      })
    },
    []
  )

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4',
        reverse && 'flex-row-reverse'
      )}
    >
      <div>
        <P className="flex-1 mb-0">
          {!!dateLabel && <span>{dateLabel}, </span>}
          <span className="text-text-tertiary">
            {date.format('D MMMM')}
          </span>{' '}
          <br />
        </P>
      </div>

      <div className="flex gap-2">
        <RoundButton onClick={onChangeDayOffset(-1)} icon={'ArrowBack'} />
        <RoundButton onClick={onChangeDayOffset(1)} icon={'ArrowForward'} />
      </div>
    </div>
  )
}
