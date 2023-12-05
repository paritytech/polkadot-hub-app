import * as React from 'react'
import { Tag } from './Tag'
import { toggleInArray } from '#client/utils'

type FilterOption<T> = {
  id: T | null
  name: string
}
type OnChangeString<T> = (value: T | null) => void
type OnChangeStringArray<T> = (value: T[]) => void
type Props<T> = {
  options: FilterOption<T>[]
  className?: string
  keepOne?: boolean
} & (
  | {
      multiple: false
      value: T | null
      onChange: OnChangeString<T>
    }
  | {
      multiple: true
      value: T[]
      onChange: OnChangeStringArray<T>
    }
)
export const Filters = <T,>(props: React.PropsWithChildren<Props<T>>) => {
  const {
    options,
    onChange,
    className,
    value,
    multiple = false,
    keepOne,
  } = props
  const onClick = React.useCallback(
    (id: FilterOption<T>['id']) => () => {
      if (multiple && Array.isArray(value)) {
        ;(onChange as OnChangeStringArray<T>)(
          id ? toggleInArray(value, id, keepOne) : []
        )
      } else {
        ;(onChange as OnChangeString<T>)(id)
      }
    },
    [value, multiple]
  )
  return (
    <div className={className}>
      <div className="-mb-1 -mr-1">
        {options.map((x: FilterOption<T>) => {
          const isMultiple = multiple && Array.isArray(value)
          let isSelected = isMultiple
            ? value.includes(x.id || ('~none~' as T))
            : value === x.id
          if (
            !x.id &&
            ((isMultiple && !value.length) || (!isMultiple && !value))
          ) {
            isSelected = true
          }
          return (
            <Tag
              key={String(x.id || '~none~')}
              className="inline-block cursor-pointer hover:opacity-70 mr-1 mb-1"
              color={isSelected ? 'blue' : 'gray'}
              onClick={onClick(x.id)}
            >
              {x.name}
            </Tag>
          )
        })}
      </div>
    </div>
  )
}
