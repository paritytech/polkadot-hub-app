import React from 'react'
import { cn } from '#client/utils'

type LoaderSpinnerProps = {
  // size: 'small' | 'medium'
  // color: 'purple' | 'gray'
  className?: string
}
export const LoaderSpinner: React.FC<LoaderSpinnerProps> = ({ className = '' }) => (
  <div className={cn('relative w-full h-14', className)}>
    <div className='a-spin absolute m-auto inset-0 w-8 h-8 border-2 border-t-transparent border-r-transparent border-purple-400 rounded-[999px]'/>
  </div>
)