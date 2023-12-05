// TODO: move this file to src/modules/office-visits/client/components

import { cn } from '#client/utils/index'
import React from 'react'
import { Icons, Icon } from './Icons'

export enum CTAType {
  Visit = 'visit',
  Meeting = 'meeting',
  Guest = 'guest',
}

const CTAText = {
  [CTAType.Visit]: ['Visit the Office', 'Visit the Office'],
  [CTAType.Meeting]: ['Book a Room', 'Book a Meeting Room'],
  [CTAType.Guest]: ['Invite a Guest', 'Invite a Guest'],
}

const CTAIcon: Record<CTAType, Icon> = {
  [CTAType.Visit]: 'Visit',
  [CTAType.Meeting]: 'Meeting',
  [CTAType.Guest]: 'Guest',
}

const BGHoverColours = {
  [CTAType.Meeting]: 'bg-cta-hover-jade',
  [CTAType.Visit]: 'bg-cta-hover-purple',
  [CTAType.Guest]: 'bg-cta-hover-cerulean',
}

type Props = {
  type: CTAType
  onClick: () => void
}

export const CTA: React.FC<Props> = ({ type = CTAType.Visit, onClick }) => {
  const mobileClass = 'text-center justify-center items-center'
  let className = cn(
    mobileClass,
    'group flex flex-col xl:flex-row gap-2 rounded-tiny cursor-pointer'
  )
  let textClassName = 'text-sm font-medium whitespace-nowrap'

  switch (type) {
    case CTAType.Meeting:
      className = cn(className, 'hover:bg-cta-hover-jade')
      textClassName = cn(textClassName, 'text-cta-jade')
      break
    case CTAType.Guest:
      className = cn(className, 'hover:bg-cta-hover-cerulean')
      textClassName = cn(textClassName, 'text-cta-cerulean')
      break
    case CTAType.Visit:
      className = cn(className, 'hover:bg-cta-hover-purple')
      textClassName = cn(textClassName, 'text-cta-purple')
      break
  }
  const IconComponent = Icons[CTAIcon[type]]
  return (
    <div className={cn('px-2 sm:px-4 py-2', className)} onClick={onClick}>
      <div
        className={`h-10 w-10 rounded-full flex justify-center items-center ${BGHoverColours[type]} group-hover:bg-transparent`}
      >
        <IconComponent />
      </div>
      <div className={textClassName}>
        <span className="inline sm:hidden">{CTAText[type][0]}</span>
        <span className="hidden sm:inline">{CTAText[type][1]}</span>
      </div>
    </div>
  )
}
