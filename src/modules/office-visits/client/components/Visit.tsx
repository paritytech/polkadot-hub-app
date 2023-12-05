import dayjs from 'dayjs'
import React from 'react'
import { DropDownMenu, P } from '#client/components/ui'
import { Size } from '#client/components/ui/Button'
import { cn } from '#client/utils'
import { GenericVisit, OfficeVisitsHeaders, VisitType } from '#shared/types'

const mainType = VisitType.Visit

const VisitRow = ({
  dateTime,
  value,
  description,
  id,
  idx,
  type,
  onCancel,
}: {
  dateTime?: string | null
  value: any
  description?: string
  id?: string | null
  idx: number
  type: string
  onCancel: (id: string, type: string) => void
}) => {
  let grid = 'grid-cols-3 grid-cols-[40%_50%_10%]'
  if (!dateTime) {
    grid = 'grid-cols-2 grid-cols-[90%_10%]'
  }
  const isMainType = type === mainType
  return (
    <div key={`${dateTime}_${value}`}>
      <div className={`grid ${grid} group`}>
        {dateTime && (
          <P
            onClick={() => (window.location.href = `/${type}s/${id}`)}
            textType="additional"
            className="break-words overflow-wrap w-[90px] sm:w-full group-hover:cursor-pointer group-hover:opacity-50"
          >
            {dateTime}
          </P>
        )}
        <div
          onClick={() => (window.location.href = `/${type}s/${id}`)}
          className={cn(
            `flex items-center justify-between  ${
              idx > 0 ? 'border-t' : ''
            } group-hover:cursor-pointer group-hover:opacity-50`
          )}
        >
          <P className={`${isMainType ? 'text-base' : 'text-sm'}`}>
            {value}
            {description && (
              <span className="text-text-tertiary">, {description}</span>
            )}
          </P>{' '}
        </div>
        <div
          className={cn(
            `flex justify-end items-center ${isMainType ? 'mr-4' : ''} ${
              idx > 0 ? 'border-t' : ''
            } mt-0 mb-0`
          )}
        >
          <DropDownMenu
            items={[
              {
                name: 'Cancel',
                action: () => onCancel(id ?? '', type),
                icon: 'Cross',
              },
            ]}
            buttonSize={Size.Small}
          />
        </div>
      </div>
    </div>
  )
}

export const DateHeader = ({ dateValue }: { dateValue: string | Date }) => (
  <P textType="additional" className="mt-0 mb-0">
    <span className="text-accents-red">
      {dayjs(dateValue).isToday() ? `Today` : dayjs(dateValue).format('dddd')}
      {' · '}
    </span>
    <span className="text-text-secondary">
      {dayjs(dateValue).format('D MMMM')}
    </span>
  </P>
)

export const Visit: React.FC<{
  data: Record<string, Array<GenericVisit>>
  dataTypes: string[]
  date: string | Date
  idx: number
  onEntityCancel: (id: string, type: string) => void
}> = ({ data, date, idx, onEntityCancel, dataTypes }) => {
  const wrapperData = data[mainType]
  return (
    <div key={`${date}_${idx}`}>
      <div className="bg-cta-hover-purple rounded-sm px-2 pt-4 pb-2 pl-4">
        <DateHeader dateValue={date} />
        {!!wrapperData?.length &&
          wrapperData.map((v: any) => (
            <VisitRow
              id={v.id}
              idx={0}
              key={`${v.id}${idx}`}
              value={v.value}
              description={v.description}
              onCancel={onEntityCancel}
              type={v.type}
            />
          ))}
        {dataTypes.map((type, typeIdx) => {
          if (!data[type]) {
            return null
          }
          return (
            <HighlightBlock
              title={OfficeVisitsHeaders[type as VisitType]}
              type={type}
              key={`${type}${typeIdx}`}
            >
              {data[type].map((one: any, idx: number) => (
                <VisitRow
                  id={one.id}
                  idx={idx}
                  key={`${one.id}${one.value}`}
                  dateTime={one?.dateTime}
                  value={one.value}
                  description={one?.description}
                  onCancel={onEntityCancel}
                  type={one.type}
                />
              ))}
            </HighlightBlock>
          )
        })}
      </div>
    </div>
  )
}

export const BGColors: Record<string, string> = {
  [VisitType.RoomReservation]: 'bg-cta-hover-jadeNoOpacity',
  [VisitType.Visit]: 'bg-cta-hover-purpleNoOpacity',
  [VisitType.Guest]: 'bg-cta-hover-ceruleanNoOpacity',
}

const HighlightBlock = ({
  type = VisitType.RoomReservation,
  title,
  className,
  children,
}: {
  type?: string
  title: string
  className?: string
  children: React.ReactNode
}) => {
  return (
    <div className={className}>
      <P textType="additional" className="text-text-tertiary mb-2 mt-2">
        {title}
      </P>
      <div className={cn('rounded-[12px] px-4', BGColors[type])}>
        {children}
      </div>
    </div>
  )
}
