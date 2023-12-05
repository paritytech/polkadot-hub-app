import { cn } from '#client/utils'
import React from 'react'

type HeaderProps = React.HTMLAttributes<HTMLHeadingElement>

export const H1: React.FC<HeaderProps> = ({ className, ...props }) => (
  <h1
    className={cn('font-extra text-lg mb-5 leading-8', className)}
    {...props}
  />
)
export const H2: React.FC<HeaderProps> = ({ className, ...props }) => (
  <h2
    className={cn('font-extra text-base leading-5 mb-5', className)}
    {...props}
  />
)
export const H3: React.FC<HeaderProps> = ({ className, ...props }) => (
  <h3 className={cn('font-extra text-sm font-bold mb-5', className)} {...props} />
)

interface PProps extends React.HTMLAttributes<HTMLParagraphElement> {
  textType?: 'additional' | 'additionalBold' | 'detail'
}

export const P: React.FC<PProps> = ({ className, textType, ...props }) => {
  let style = 'text-base mt-2 mb-2'
  switch (textType) {
    case 'additional':
      style = 'text-sm'
      break
    case 'additionalBold':
      style = 'text-sm font-semibold'
      break
    case 'detail':
      style = 'text-tiny'
      break
  }
  return <p className={cn('my-4', style, className)} {...props} />
}

export const HR: React.FC<React.HTMLAttributes<HTMLHRElement>> = ({
  className = '',
  ...props
}) => {
  return <hr className={cn('bg-applied-separator', className)} {...props} />
}
