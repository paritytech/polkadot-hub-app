import { Button } from '#client/components/ui'
import { DATE_FORMAT } from '#client/constants'
import { cn } from '#client/utils'
import dayjs from 'dayjs'
import React from 'react'

type DatePickerProps = {
  selectedDates: string[]
  onToggleDate: (date: string) => void
  availableDateRange: number
  workingDays?: number[]
  preReservedDates: string[]
  reservedDates: string[]
}
type CalendarDay = {
  date: dayjs.Dayjs
  day: number
  month: number
  year: number
  isCurrentMonth: boolean
  isCurrentDay: boolean
}
export const DatePicker: React.FC<DatePickerProps> = ({
  selectedDates,
  onToggleDate,
  workingDays = [0, 1, 2, 3, 4, 5, 6],
  availableDateRange,
  preReservedDates,
  reservedDates,
}) => {
  const now = dayjs()
  const weekDays = React.useMemo<string[]>(() => {
    const days: string[] = []
    for (let i = 0; i < 7; i++) {
      days.push(now.weekday(i + 1).format('dd'))
    }
    return days
  }, [])
  const [currentMonth, setCurrentMonth] = React.useState<dayjs.Dayjs>(now)
  const [weeks, setWeeks] = React.useState<CalendarDay[][]>([])

  const onNextMonth = React.useCallback(
    (ev: React.MouseEvent<HTMLButtonElement>) => {
      ev.preventDefault()
      setCurrentMonth(currentMonth.add(1, 'month'))
    },
    [currentMonth]
  )
  const onPrevMonth = React.useCallback(
    (ev: React.MouseEvent<HTMLButtonElement>) => {
      ev.preventDefault()
      setCurrentMonth(currentMonth.subtract(1, 'month'))
    },
    [currentMonth]
  )

  const onDateClick = React.useCallback(
    (date: string) => (ev: React.MouseEvent<HTMLButtonElement>) => {
      ev.preventDefault()
      onToggleDate(date)
    },
    [onToggleDate]
  )

  React.useEffect(() => {
    let currentDate = currentMonth.startOf('month').weekday(1)
    const nextMonth = currentMonth.add(1, 'month').month()
    let resultWeeks: CalendarDay[][] = []
    let week: CalendarDay[] = []
    let weekDayIndex = 1
    while (currentDate.startOf('isoWeek').month() !== nextMonth) {
      week.push({
        date: currentDate,
        day: currentDate.date(),
        month: currentDate.month(),
        year: currentDate.year(),
        isCurrentMonth: currentDate.month() === currentMonth.month(),
        isCurrentDay: currentDate.isToday(),
      })
      if (weekDayIndex === 7) {
        resultWeeks.push(week)
        week = []
        weekDayIndex = 0
      }
      weekDayIndex++
      currentDate = currentDate.add(1, 'day')
    }
    if (week.length) {
      resultWeeks.push(week)
    }
    setWeeks(resultWeeks)
  }, [currentMonth])

  return (
    <div>
      {/* Header */}
      <div className="flex items-center mb-6">
        <div className="flex-auto">
          <b className="">{currentMonth.format('MMMM YYYY')}</b>
        </div>

        <Button
          size="small"
          kind="secondary"
          onClick={onPrevMonth}
          className="mr-2 rounded-full _text-xl"
        >
          ←
        </Button>
        <Button
          size="small"
          kind="secondary"
          onClick={onNextMonth}
          className="rounded-full _text-xl"
        >
          →
        </Button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map((x, i) => (
          <div
            className={cn(
              'flex justify-center items-center',
              i + 1 > 5 ? 'text-red-500' : ''
            )}
            key={x}
          >
            {x}
          </div>
        ))}
      </div>

      {/* Week rows */}
      {weeks.map((week, weekIndex) => (
        <div className="grid grid-cols-7 gap-2 mb-2" key={weekIndex}>
          {week.map((day, dayIndex) => {
            const dateString = day.date.format(DATE_FORMAT)
            const isSelected = selectedDates.includes(dateString)
            const isReserved = reservedDates.includes(dateString)
            const isPreReserved = preReservedDates.includes(dateString)
            const isUnavailable =
              isReserved ||
              isPreReserved ||
              !workingDays.includes(dayIndex) ||
              !day.date.isSameOrAfter(now, 'day') ||
              day.date.diff(now, 'day') >= availableDateRange
            return day.isCurrentMonth ? (
              <Button
                key={dayIndex}
                kind={isSelected || isPreReserved ? 'primary' : 'secondary'}
                onClick={onDateClick(dateString)}
                disabled={isUnavailable}
                className={cn(
                  'relative',
                  !isUnavailable &&
                    !isSelected &&
                    !isPreReserved &&
                    'bg-gray-100',
                  'px-0 flex justify-center items-center' /* FIXME: */
                )}
                color={isSelected || isPreReserved ? 'purple' : 'default'}
              >
                <span
                  className={cn(
                    day.isCurrentDay &&
                      !isSelected &&
                      !isPreReserved &&
                      'text-red-500'
                  )}
                >
                  {day.day}
                </span>
              </Button>
            ) : (
              <div key={dayIndex} />
            )
          })}
        </div>
      ))}
    </div>
  )
}
