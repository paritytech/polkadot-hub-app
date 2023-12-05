import React from 'react'
import { useStore } from '@nanostores/react'
import * as stores from '#client/stores'
import { notEq } from '#shared/utils/fp'

type Props = {
  children: React.ReactNode
  allowedRoutes?: string[] | undefined
  disallowedRoutes?: string[] | undefined
}

export const RouteValidator: React.FC<Props> = ({ children, allowedRoutes = [], disallowedRoutes = []}) => {
  const page = useStore(stores.router)
  if (!page) return null
  let match = false
  if (allowedRoutes.length && !disallowedRoutes.length) {
    match = allowedRoutes.includes(page.route)
  }
  if (!allowedRoutes.length && disallowedRoutes.length) {
    match = disallowedRoutes.every(notEq(page.route))
  }
  return match ? (
    <>
      {children}
    </>
  ) : null
}
