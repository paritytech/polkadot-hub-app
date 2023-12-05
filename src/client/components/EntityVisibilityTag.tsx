import React from 'react'
import { Tag } from '#client/components/ui'
import { EntityVisibility } from '#shared/types'

export const ENTITY_VISIBILITY_LABEL = {
  [EntityVisibility.None]: 'Nobody (draft)',
  [EntityVisibility.Url]: 'Registered users with a link',
  [EntityVisibility.Visible]: 'Registered users',
  [EntityVisibility.UrlPublic]: 'Everyone (public)',
}

const COLOR = {
  [EntityVisibility.None]: 'gray',
  [EntityVisibility.Url]: 'yellow',
  [EntityVisibility.Visible]: 'green',
  [EntityVisibility.UrlPublic]: 'blue',
}

export const EntityVisibilityTag: React.FC<{
  visibility: EntityVisibility
}> = ({ visibility, ...props }) => (
  // @ts-ignore FIXME: define common client Color enum
  <Tag color={COLOR[visibility]} size="small" {...props}>
    {ENTITY_VISIBILITY_LABEL[visibility]}
  </Tag>
)
