import React from 'react'
import { cn } from '#client/utils'

type Props = {
  className?: string
  children: React.ReactNode
}
export const Container: React.FC<Props> = ({ className = '', children }) => (
  <div className={cn('max-w-[1440px] mx-auto sm:px-6 px-1', className)}>
    {children}
  </div>
)
