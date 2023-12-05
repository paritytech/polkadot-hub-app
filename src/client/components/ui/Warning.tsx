import { cn } from '#client/utils/index'
import * as React from 'react'
import { Icons } from './Icons'
import { P } from './Text'

type Props = {
  text: string
  className?: string
  children: React.ReactNode
}

export const Warning: React.FC<Props> = ({ text, className, children }) => (
  <div
    className={cn(
      'flex gap-2 my-6 text-sm justify-center items-start',
      className
    )}
  >
    <Icons.WarningIcon />
    <div className="flex flex-col gap-2">
      <P className="font-bold">{text}</P>
      {children}
    </div>
  </div>
)
