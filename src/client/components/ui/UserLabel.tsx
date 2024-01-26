import { User, UserCompact } from '#shared/types'
import { cn } from '#client/utils'
import React from 'react'
import { Avatar } from './Avatar'
import { Link } from './Link'
import { Tag } from './Tag'
import { USER_ROLE_BY_ID } from '#client/constants'

type Props = {
  user: User | UserCompact
  hideRole?: boolean
}
export const UserLabel: React.FC<Props> = ({ user, hideRole = false }) => {
  return user ? (
    <span className="inline-flex items-center w-max">
      <Avatar
        src={user.avatar}
        userId={user.id}
        size="small"
        className="mr-2 flex-inline"
      />
      <Link
        href={`/profile/${user.id}`}
        target="_blank"
        className={cn(!user.isInitialised && 'opacity-50')}
        title={
          !user.isInitialised
            ? 'The user has not been onboarded yet'
            : undefined
        }
        kind="secondary"
      >
        {user.fullName}
      </Link>
      {!hideRole && <UserRoleLabel role={user.role} className="ml-2" />}
    </span>
  ) : null
}

type UserRoleLabelType = {
  role: string
  className?: string
}
export const UserRoleLabel: React.FC<UserRoleLabelType> = ({
  role,
  ...props
}) => {
  const roleRecord = USER_ROLE_BY_ID[role]
  return (
    <Tag
      className={cn(props.className)}
      size="small"
      color={roleRecord ? 'gray' : 'red'}
      title={roleRecord ? '' : 'Unsupported role'}
    >
      {roleRecord?.name || role}
    </Tag>
  )
}
