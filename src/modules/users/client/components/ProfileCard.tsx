import React, { ReactNode } from 'react'
import { Icon, Icons } from '#client/components/ui/Icons'
import {
  Avatar,
  FButton,
  Link,
  P,
  Tag,
  WidgetWrapper,
} from '#client/components/ui'
import { getTzDifference } from '../helpers'
import { useStore } from '@nanostores/react'
import * as stores from '#client/stores'
import { cn } from '#client/utils'
import { PublicUserProfile, UserMe } from '#shared/types'
import dayjs from 'dayjs'
import { PermissionsValidator } from '#client/components/PermissionsValidator'
import Permissions from '#shared/permissions'
import { USER_ROLES } from '#client/constants'

const ProfileRow = ({
  label,
  value,
  icon,
  accent = false,
}: {
  label: string
  value: string | ReactNode
  icon: Icon
  accent?: boolean
}) => {
  const textStyle = `${accent ? 'text-accents-pink' : 'text-text-primary'}`
  const IconComponent = Icons[icon]
  return (
    <div className="flex flex-row gap-2 items-center">
      <div className="w-6">
        <IconComponent />
      </div>
      <div>
        <span className="text-text-tertiary">{label} </span>
        <span className={textStyle}>{value}</span>
      </div>
    </div>
  )
}

export const Card = ({
  user,
  fullView = true,
  isMine = false,
}: {
  user: UserMe | PublicUserProfile
  fullView?: boolean
  isMine?: boolean
}) => {
  const location = React.useMemo(() => {
    if (user && !user.geodata?.doNotShareLocation) {
      const city = user.city || ''
      const country = user.countryName || user.country || ''
      const separator = city && country ? ', ' : ''
      return `${city}${separator}${country}`
    }
    return null
  }, [user])

  const userRoles = React.useMemo<string[]>(() => {
    return USER_ROLES.reduce<string[]>((acc, x) => {
      if (!user.roles.includes(x.id)) return acc
      return acc.concat(x.name)
    }, [])
  }, [user])

  return (
    <div className="flex flex-col">
      <a href={`/profile/${user.id}`} className="self-center">
        <Avatar
          size="big"
          src={user.avatar}
          className="sm:mr-4 mb-8"
          userId={user.id}
        />
      </a>
      <div className={cn('flex flex-col', fullView ? 'gap-6' : 'gap-4')}>
        <div className="flex flex-col gap-1">
          <P className="mb-0">{user.fullName}</P>
          <PermissionsValidator required={[Permissions.users.ListProfiles]}>
            <div className="text-text-tertiary text-base leading-6">
              {[user.jobTitle, user.team, user.department]
                .filter(Boolean)
                .map((x, i) => (
                  <span key={`${x}${i}`}>
                    {!!i && <span> &#183; </span>}
                    {x}
                  </span>
                ))}
            </div>
          </PermissionsValidator>
          <div className="mt-3">
            {userRoles.map((x) => (
              <Tag key={x} size="small" color="gray" className="mr-1 mb-2">
                {x}
              </Tag>
            ))}
          </div>
        </div>
        <PermissionsValidator required={[Permissions.users.ListProfiles]}>
          <>
            <div className="flex flex-col gap-4">
              {location && (
                <div className="flex flex-col gap-4">
                  <ProfileRow
                    label="Lives in"
                    value={<Link href="/map/">{location}</Link>}
                    icon="House"
                    accent
                  />
                  {user.geodata?.gmtOffset && user?.geodata?.timezone ? (
                    <ProfileRow
                      label="Timezone"
                      value={`${getTzDifference(user?.geodata?.timezone)} ${
                        user.geodata?.gmtOffset
                      }`}
                      icon="Clock"
                    />
                  ) : null}
                </div>
              )}
              {fullView && user.birthday && (
                <ProfileRow
                  label="Birthday"
                  value={dayjs(user.birthday).format('D MMMM')}
                  icon="Cake"
                />
              )}
            </div>
            {!fullView && (
              <FButton
                kind="link"
                className="no-underline w-fit ml-[-8px]"
                href={`/profile/${user.id}`}
              >
                Show Full Info
              </FButton>
            )}
            {fullView && isMine && (
              <PermissionsValidator
                required={[Permissions.users.ManageProfile]}
              >
                <div>
                  <FButton
                    kind="secondary"
                    className="w-full h-14"
                    onClick={() => stores.goTo('profile')}
                  >
                    Edit Profile
                  </FButton>
                </div>
              </PermissionsValidator>
            )}
          </>
        </PermissionsValidator>
      </div>
    </div>
  )
}

export const ProfileCard = () => {
  const user = useStore(stores.me)

  return (
    <WidgetWrapper>
      {user ? <Card user={user} fullView={false} isMine={true} /> : null}
    </WidgetWrapper>
  )
}
