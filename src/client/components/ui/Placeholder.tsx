import React from 'react'
import { cn } from '#client/utils'

type Props = {
  children: React.ReactNode
  className?: string
}

export const Placeholder: React.FC<Props> = (props) => {
  return (
    <div className={cn('text-gray-400 text-center my-8', props.className)}>
      {props.children}
    </div>
  )
}
