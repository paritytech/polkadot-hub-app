import React from 'react'
import { cn } from '#client/utils'

type Props = {
  color?: string
  children: React.ReactNode
  className?: string
}

export const Background: React.FC<Props> = ({
  color,
  children,
  className,
}) => (
  <div
    style={color ? { backgroundColor: color } : {}}
    className={cn(
      'min-h-screen f-width',
      !color && 'bg-bg-system',
      className,
    )}
  >
    {children}
  </div>
)
