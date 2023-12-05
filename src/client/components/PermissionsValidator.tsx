import * as stores from '#client/stores'
import { useStore } from '@nanostores/react'
import React from 'react'

type Props = {
  required: string[]
  onReject?: () => void
  onRejectGoHome?: boolean
  children: React.ReactNode
}

export const PermissionsValidator: React.FC<Props> = ({
  required = [],
  children,
  onReject,
  onRejectGoHome = false,
}) => {
  const permissions = useStore(stores.permissions)
  const [isValid, setIsValid] = React.useState(permissions.hasAll(required))
  React.useEffect(() => {
    if (!permissions.hasAll(required)) {
      if (onRejectGoHome) {
        setTimeout(() => stores.goTo('home'), 0)
      } else if (onReject) {
        setTimeout(onReject, 0)
      }
      setIsValid(false)
    } else {
      setIsValid(true)
    }
  }, [required])
  return isValid ? <>{children}</> : null
}
