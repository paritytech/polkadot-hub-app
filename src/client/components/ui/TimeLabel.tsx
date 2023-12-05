import React from 'react'
import dayjs from 'dayjs'

type Props = {
  value?: Date | string
  format: string
  interval?: number
}

export const TimeLabel: React.FC<Props> = ({
  value = undefined,
  format,
  interval = 1e3,
}) => {
  const [state, setState] = React.useState(dayjs(value).format(format))
  React.useEffect(() => {
    if (!value) {
      const loop = setInterval(() => setState(dayjs().format(format)), interval)
      return () => clearInterval(loop)
    }
  }, [])
  return <span>{state}</span>
}
