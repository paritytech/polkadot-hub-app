import { cn } from '#client/utils/index'
import * as React from 'react'

export const ProgressDots: React.FC<{ value: number; total: number }> = ({
  value,
  total,
}) => {
  return (
    <div className="flex justify-between">
      {Array.from(Array(total)).map((x, i) => (
        <span
          key={i}
          className={cn(
            'w-[12px] h-[12px] mx-1 rounded-[6px]',
            value > i ? 'bg-accents-pink' : 'bg-pink-50'
          )}
        />
      ))}
    </div>
  )
}
