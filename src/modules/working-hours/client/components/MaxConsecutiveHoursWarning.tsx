import React from 'react'

type Props = {
  maxHours: number | undefined
  time: [string, string]
}

export function MaxConsecutiveHoursWarning(props: Props) {
  const durationMinutes = React.useMemo(() => {
    if (!props.maxHours || !props.time[0] || !props.time[1]) return null
    const [startHours = 0, startMinutes = 0] = props.time[0]
      .split(':')
      .map(Number)
    const [endHours = 0, endMinutes = 0] = props.time[1].split(':').map(Number)
    const diff = 60 * endHours + endMinutes - (60 * startHours + startMinutes)
    if (diff <= 0) return null
    return diff
  }, [props.time])

  if (!props.maxHours || !durationMinutes) {
    return null
  }

  if (durationMinutes <= props.maxHours * 60) {
    return null
  }

  return (
    <div className="text-orange-500 text-xs mt-1 sm:pl-8">
      👆 Hmm, are you sure you’ve been working non-stop for{' '}
      {Math.floor(durationMinutes / 60)} hours?
      <br />
      You deserve a break – don’t forget to log it!
    </div>
  )
}
