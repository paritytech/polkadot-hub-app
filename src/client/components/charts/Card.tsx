import React from 'react'
import { WidgetWrapper } from '#client/components/ui'

export const Card: React.FC<{
  title: string | React.ReactNode
  subtitle: string | React.ReactNode
}> = (props) => {
  return (
    <WidgetWrapper className="bg-blue-50">
      <div className="text-2xl font-medium">{props.title}</div>
      <div className="text-text-secondary whitespace-nowrap text-sm">
        {props.subtitle}
      </div>
    </WidgetWrapper>
  )
}
