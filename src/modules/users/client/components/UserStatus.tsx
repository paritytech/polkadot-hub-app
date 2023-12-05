import { Link, TimeLabel, WidgetWrapper } from '#client/components/ui'
import { useStore } from '@nanostores/react'
import React from 'react'
import * as stores from '#client/stores'

export const UserStatus: React.FC = () => {
  const me = useStore(stores.me)
  const isAdmin = useStore(stores.isAdmin)
  return (
    <WidgetWrapper className="rounded-b-none mb-0 md:rounded-b-sm md:mb-2">
      Welcome back
      {me?.fullName ? (
        <span>
          , <a href="/me">{me?.fullName}</a>
        </span>
      ) : ''}
      ! Today is <TimeLabel format="dddd, MMMM D, HH:mm" />.{' '}
      {isAdmin && <Link href="/admin">Admin</Link>}
    </WidgetWrapper>
  )
}
