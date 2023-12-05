import { cn } from '#client/utils'
import React from 'react'

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  kind?: 'primary' | 'secondary'
}

export const Link: React.FC<Props> = ({
  className,
  kind = 'primary',
  ...rest
}) => (
  <a
    className={cn(
      kind === 'secondary' && 'text-text-secondary hover:text-text-primary',
      kind === 'primary' && 'text-purple-400 hover:text-purple-600',
      'focus-visible:ring-purple-100 focus-visible:ring-2 underline cursor-pointer',
      className
    )}
    rel={rest.target === '_blank' ? 'noreferrer' : undefined}
    {...rest}
  />
)
