import * as React from 'react'
import MC from '#client/components/__import-components'
import { ComponentRef } from '#shared/types'

export const getComponentInstance = (cr: ComponentRef): React.FC<any> | null => {
  const moduleId = cr[0] as keyof typeof MC
  const moduleComponents = MC[moduleId]
  if (!moduleComponents) return null

  const componentId = cr[1] as keyof typeof moduleComponents
  const Component = MC[moduleId][componentId] as React.FC
  if (!Component) return null

  return Component
}

export const renderComponent =
  (props: Record<string, any> = {}, officeId?: string | null) =>
  (cr: ComponentRef): React.ReactElement<any> | null => {
    const Component = getComponentInstance(cr)
    if (!Component) return null
    const componentConfig = cr[2]
    const offices = componentConfig?.offices || []
    if (offices.length && !offices.includes(officeId!)) {
      return null
    }
    return <Component key={`${cr[0]}_${cr[1]}`} {...props} />
  }

