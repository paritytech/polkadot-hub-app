import { cn } from '#client/utils'
import React from 'react'
import { H2 } from './Text'

type ButtonsWrapperProps = {
  right?: React.ReactNode[]
  left?: React.ReactNode[]
  rightWpap?: boolean
  className?: string
}
export const ButtonsWrapper: React.FC<ButtonsWrapperProps> = ({
  left = [],
  right = [],
  rightWpap = false,
  className = '',
}) => {
  return (
    <div className={cn('flex', className)}>
      <div className={cn('flex flex-auto flex-w', rightWpap && 'flex-wrap')}>
        {left.map((comp, i) => (
          <div key={i} className={cn(i ? 'ml-4' : '', rightWpap && 'sm:mb-4')}>
            {comp}
          </div>
        ))}
      </div>
      <div className="flex">
        {right.map((comp, i) => (
          <div key={i} className={cn(i ? 'ml-4' : '')}>
            {comp}
          </div>
        ))}
      </div>
    </div>
  )
}

type WidgetWrapperProps = {
  className?: string
  titleClassName?: string
  children: React.ReactNode
  title?: string
  titleUrl?: string
}
export const WidgetWrapper: React.FC<WidgetWrapperProps> = ({
  children,
  className = '',
  titleClassName = '',
  title = '',
  titleUrl,
}) => {
  if (!children) return null
  return (
    <div className={cn('bg-bg-primary rounded-sm p-6 mb-1 md:mb-2', className)}>
      {!!title && (
        <H2 className={(cn('mb-6'), titleClassName)}>
          {titleUrl ? (
            <a href={titleUrl} className="hover:opacity-70">
              {title}
            </a>
          ) : (
            title
          )}
        </H2>
      )}
      {children}
    </div>
  )
}

type ComponentWrapperProps = {
  className?: string
  children: React.ReactNode
  wide?: boolean
}
export const ComponentWrapper: React.FC<ComponentWrapperProps> = ({
  children,
  className = '',
  wide = false,
}) => {
  if (!children) return null
  return (
    <div
      className={cn(
        'bg-bg-primary rounded-sm p-6 sm:p-8 container mx-auto',
        !wide && 'max-w-3xl',
        className
      )}
    >
      {children}
    </div>
  )
}

type WidgetsWrapperProps = {
  type: 'vertical' | 'horizontal'
  widgets: React.ReactNode[]
}
export const WidgetsWrapper: React.FC<WidgetsWrapperProps> = ({
  type,
  widgets,
}) => {
  return (
    <div className={cn('flex', type === 'vertical' ? 'flex-col' : 'flex-row')}>
      {widgets.map((comp, i) => (
        <WidgetWrapper className={cn(i ? 'ml-4' : '', 'flex-1 bg-amber-200')}>
          {comp}
        </WidgetWrapper>
      ))}
    </div>
  )
}

type InputsWrapperProps = {
  inputs: React.ReactNode[]
  className?: string
  fullWidth?: boolean
}
export const InputsWrapper: React.FC<InputsWrapperProps> = ({
  inputs,
  className = '',
  fullWidth = false,
}) => {
  return fullWidth ? (
    <div
      className={cn('sm:grid gap-4', `grid-cols-${inputs.length}`, className)}
    >
      {inputs.map((input, i) => (
        <div key={i} className="mb-4 sm:mb-0">
          {input}
        </div>
      ))}
    </div>
  ) : (
    <div className="flex">
      <div>
        <div
          className={cn(
            'sm:grid gap-4',
            `grid-cols-${inputs.length}`,
            className
          )}
        >
          {inputs.map((input, i) => (
            <div key={i} className="mb-4 sm:mb-0">
              {input}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
