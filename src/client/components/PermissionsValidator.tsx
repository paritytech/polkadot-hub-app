import * as stores from '#client/stores'
import { useStore } from '@nanostores/react'
import React from 'react'

type Props = {
  required: string[]
  officeId?: string
  onReject?: () => void
  onRejectRender?: React.ReactElement
  onRejectGoHome?: boolean
  children: React.ReactNode
}

export const PermissionsValidator: React.FC<Props> = ({
  required = [],
  officeId,
  children,
  onReject,
  onRejectGoHome = false,
  onRejectRender = null,
}) => {
  const permissions = useStore(stores.permissions)
  const [isValid, setIsValid] = React.useState(
    permissions.hasAll(required, officeId)
  )
  React.useEffect(() => {
    if (!permissions.hasAll(required, officeId)) {
      if (onRejectGoHome) {
        setTimeout(() => stores.goTo('home'), 0)
      } else if (onReject) {
        setTimeout(onReject, 0)
      }
      setIsValid(false)
    } else {
      setIsValid(true)
    }
  }, [required, officeId])
  if (isValid) {
    return <>{children}</>
  }
  if (onRejectRender) {
    return onRejectRender
  }
  return null
}
