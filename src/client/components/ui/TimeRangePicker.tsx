import * as React from 'react'
import { Input } from './Input'
import { cn } from '#client/utils'

type TimeRangePickerProps = {
  from: string
  to: string
  onChange?: (from: string, to: string) => void
  inputClassName?: string
}

export const TimeRangePicker: React.FC<TimeRangePickerProps> = ({
  from,
  to,
  onChange,
  inputClassName,
}) => {
  const onTimeChange = React.useCallback(
    (order: 0 | 1) => (value: string) => {
      if (onChange) {
        const range: [string, string] = [from, to]
        range[order] = value
        onChange(range[0], range[1])
      }
    },
    [onChange, from, to]
  )
  return (
    <div className="inline-flex items-center gap-x-1">
      <Input
        className={cn(inputClassName)}
        type="time"
        value={from}
        onChange={onTimeChange(0)}
      />
      <div className="hidden sm:block text-text-disabled">–</div>
      <Input
        className={cn(inputClassName)}
        type="time"
        value={to}
        onChange={onTimeChange(1)}
      />
    </div>
  )
}
