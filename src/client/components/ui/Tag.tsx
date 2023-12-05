import { cn } from '#client/utils'
import React, { useMemo } from 'react'

type Color = 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'purple'
export type Size = 'small' | 'normal'
type Props = React.HTMLAttributes<HTMLSpanElement> & {
  color: Color
  href?: string
  size?: Size
  children?: React.ReactNode
}

export const Tag: React.FC<Props> = ({
  color = 'gray',
  href = null,
  size = 'normal',
  className = '',
  children,
  ...rest
}) => {
  const tagClassName = cn(
    'rounded-md font-medium text-sm',
    size === 'normal' && 'py-2 px-4',
    size === 'small' && 'px-[7px] py-[2px]'
  )
  const colorClassNames = useMemo(() => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-600'
      case 'gray':
        return 'bg-gray-100 text-gray-500'
      case 'green':
        return 'bg-green-100 text-green-600'
      case 'yellow':
        return 'bg-yellow-100 text-yellow-600'
      case 'red':
        return 'bg-red-100 text-red-600'
      case 'purple':
        return 'bg-purple-50 text-purple-500'
      default:
        return 'bg-gray-100 text-gray-500'
    }
  }, [color])
  return size === 'small' ? (
    <span
      className={cn(
        size === 'small' && 'inline-flex items-center h-[1.25em]',
        className
      )}
    >
      {href ? (
        <a href={href} className={cn(tagClassName, colorClassNames)} {...rest}>
          {children}
        </a>
      ) : (
        <span className={cn(tagClassName, colorClassNames)} {...rest}>
          {children}
        </span>
      )}
    </span>
  ) : href ? (
    <a
      href={href}
      className={cn(tagClassName, colorClassNames, className)}
      {...rest}
    >
      {children}
    </a>
  ) : (
    <span className={cn(tagClassName, colorClassNames, className)} {...rest}>
      {children}
    </span>
  )
}
