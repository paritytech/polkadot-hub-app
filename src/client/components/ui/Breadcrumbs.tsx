import React from 'react'
import { Link } from '#client/components/ui'
import { cn } from '#client/utils'

type Props = {
  className?: string
  items: Array<{
    label: string
    href?: string
  }>
}
export const Breadcrumbs: React.FC<Props> = ({ items, className }) =>
  items.length ? (
    <div className={cn('text-sm my-6 text-gray-400', className)}>
      {items.map((item, i) => (
        <span key={`${item.label}_${item.href}`}>
          {!!i && <span className="mx-2">/</span>}
          {item.href ? (
            <Link
              className="text-gray-400 hover:text-gray-500"
              href={item.href}
            >
              {item.label}
            </Link>
          ) : (
            <span>{item.label}</span>
          )}
        </span>
      ))}
    </div>
  ) : null
