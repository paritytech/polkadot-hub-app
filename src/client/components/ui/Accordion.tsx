import { cn } from '#client/utils'
import React, { useEffect, useState } from 'react'
import { Icons } from './Icons'
import { H2 } from './Text'

type AccordionProps = {
  title: string
  open?: boolean
  children: React.ReactNode
  className?: string
}

export const Accordion: React.FC<AccordionProps> = ({
  title,
  open = false,
  children,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(open)

  const onToggleIsOpen = React.useCallback(() => setIsOpen((x) => !x), [])

  useEffect(() => {
    setIsOpen(open)
  }, [open])

  return (
    <div className={cn('rounded-md border border-fill-12', className)}>
      <div
        className="flex items-center px-6 py-4 cursor-pointer __outline-dashed outline-red-600 hover:opacity-60"
        onClick={onToggleIsOpen}
      >
        <H2 className="mb-0 flex-1">{title}</H2>
        <Icons.Arrow
          fillClassName="fill-text-tertiary"
          className={cn(
            'transition-transform duration-300',
            isOpen && 'rotate-180'
          )}
        />
      </div>
      <div
        className={cn(
          'px-6',
          'overflow-hidden transition-all duration-300',
          isOpen ? 'max-h-screen' : 'max-h-0'
        )}
      >
        <div className="pb-6">{children}</div>
      </div>
    </div>
  )
}
