import dayjs from 'dayjs'
import React, { useEffect, useState } from 'react'
import { cn } from '#client/utils'
import { P } from './Text'

export const formatTimeLeft = (
  timeLeft: number
): { term: string; value: string } => {
  const duration = dayjs.duration(timeLeft, 'seconds')
  const hours = duration.hours()
  const minutes = duration.minutes()
  const seconds = duration.seconds()

  if (hours === 0) {
    if (minutes === 0) {
      return {
        term: 'seconds',
        value: seconds.toString(),
      }
    } else {
      return {
        term: 'minutes',
        value: minutes.toString(),
      }
    }
  }

  if (hours > 0) {
    if (minutes > 0) {
      return {
        term: 'hours',
        value: dayjs(`${hours}:${minutes}`, 'HH:mm').format('H:mm'),
      }
    } else {
      return {
        term: 'hours',
        value: hours.toString(),
      }
    }
  }

  return {
    term: 'minutes',
    value: minutes.toString(),
  }
}

const FULL_DASH_ARRAY = 283

export const Counter: React.FC<{
  countDownTime: number
  totalDuration: number
}> = ({ countDownTime, totalDuration }) => {
  const [timeLeft, setTimeLeft] = useState(countDownTime)
  const [dash, setDash] = useState('')
  const [formattedTime, setFormattedTime] = useState<{
    term: string
    value: string
  } | null>(null)

  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTimeLeft((v) => {
        if (v - 1 == 0) {
          clearInterval(timerInterval)
          return 0
        }

        return v - 1
      })
    }, 1000)
    return () => clearInterval(timerInterval)
  }, [])

  useEffect(() => {
    // Divides time left by the defined time limit.
    function calculateTimeFraction() {
      const rawTimeFraction = timeLeft / totalDuration
      return rawTimeFraction - (1 / totalDuration) * (1 - rawTimeFraction)
    }

    const circleDasharray = `${(
      calculateTimeFraction() * FULL_DASH_ARRAY
    ).toFixed(0)} 283`

    setDash(circleDasharray)
    setFormattedTime(formatTimeLeft(timeLeft))
  }, [timeLeft])

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative h-[196px] w-[196px]">
        <svg
          className="absolute inset-0"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
          style={{ transform: 'scaleX(-1)' }}
        >
          <g className="fill-transparent">
            q{/* base-timer-path-remaining */}
            <path
              className={cn(
                'stroke-[6px] rounded-md origin-center rotate-90 transition-all duration-1000 stroke-accents-red'
              )}
              style={{ strokeDasharray: dash ?? 283, strokeLinecap: 'round' }}
              d="
                M 50, 50
                m -45, 0
                a 45,45 0 1,0 90,0
                a 45,45 0 1,0 -90,0
                "
            ></path>
            <circle
              cx="50"
              cy="50"
              r="38"
              className="fill-accents-redTransparent"
            />
          </g>
        </svg>

        <span className="absolute h-[196px] w-[196px] top-0 flex items-center justify-center text-4xl text-[48px] font-extrabold text-accents-red">
          {formattedTime?.value}
        </span>
      </div>
      <P className="text-[20px] text-center font-bold text-accents-red uppercase">
        {formattedTime?.term} LEFT
      </P>
    </div>
  )
}
