import { ENTITY_VISIBILITY_LABEL } from '#client/components/EntityVisibilityTag'
import {
  Button,
  CheckboxGroup,
  LabelWrapper,
  Link,
  RadioGroup,
} from '#client/components/ui'
import config from '#client/config'
import { EntityVisibility } from '#shared/types'
import { cn } from '#client/utils'
import { prop } from '#shared/utils/fp'
import React from 'react'

type Field = 'visibility' | 'allowedRoles' | 'offices'
type State = {
  visibility: EntityVisibility
  allowedRoles?: string[]
  offices?: string[]
}
type Props = {
  value: State
  visibilityTypes: EntityVisibility[]
  fields: Field[]
  onChange: (value: State) => void
  containerClassName?: string
}

const VISIBILITY_OPTIONS: Array<{ value: EntityVisibility; label: string }> = [
  {
    value: EntityVisibility.None,
    label: ENTITY_VISIBILITY_LABEL[EntityVisibility.None],
  },
  {
    value: EntityVisibility.Url,
    label: ENTITY_VISIBILITY_LABEL[EntityVisibility.Url],
  },
  {
    value: EntityVisibility.Visible,
    label: ENTITY_VISIBILITY_LABEL[EntityVisibility.Visible],
  },
  {
    value: EntityVisibility.UrlPublic,
    label: ENTITY_VISIBILITY_LABEL[EntityVisibility.UrlPublic],
  },
]

export const EntityAccessSelector: React.FC<Props> = ({
  fields,
  visibilityTypes,
  ...props
}) => {
  const [showAllRoles, setShowAllRoles] = React.useState(
    config.roles.length <= 10
  )
  const roleIds = React.useMemo(
    () => config.roles.filter(prop('accessByDefault')).map(prop('id')),
    []
  )

  const officeIds = React.useMemo(() => config.offices.map(prop('id')), [])

  const allowedRolesValue = React.useMemo<string[]>(() => {
    const value = props.value.allowedRoles || []
    return value.length ? value : roleIds
  }, [props.value.allowedRoles, roleIds])

  const officesValue = React.useMemo<string[]>(() => {
    const value = props.value.offices || []
    return value.length ? value : officeIds
  }, [props.value.offices, officeIds])

  const showAllowedRolesList = React.useMemo(() => {
    return (
      fields.includes('allowedRoles') &&
      props.value.visibility !== EntityVisibility.None &&
      props.value.visibility !== EntityVisibility.UrlPublic
    )
  }, [fields, props.value])

  const showOfficesList = React.useMemo(() => {
    return (
      fields.includes('offices') &&
      props.value.visibility === EntityVisibility.Visible
    )
  }, [fields, props.value])

  const onChange: <F extends Field>(field: F) => (value: State[F]) => void =
    React.useCallback(
      (field) => (value) => {
        if (!fields.includes(field)) return
        const result: State = {
          visibility: props.value.visibility,
          allowedRoles: allowedRolesValue,
          offices: officesValue,
        }
        result[field] = value
        if (!fields.includes('allowedRoles')) {
          delete result.allowedRoles
        }
        if (!fields.includes('offices')) {
          delete result.offices
        }
        if (result.allowedRoles && !result.allowedRoles.length) {
          result.allowedRoles = roleIds
        }
        if (result.offices && !result.offices.length) {
          result.offices = officeIds
        }
        if (result.visibility === EntityVisibility.None) {
          result.allowedRoles = []
          result.offices = []
        }
        if (result.visibility === EntityVisibility.Url) {
          result.offices = []
        }
        if (result.visibility === EntityVisibility.UrlPublic) {
          result.allowedRoles = []
          result.offices = []
        }
        props.onChange(result)
      },
      [
        fields,
        props.onChange,
        props.value,
        allowedRolesValue,
        officesValue,
        officeIds,
        roleIds,
      ]
    )

  const filteredRoles = React.useMemo<
    Array<{ value: string; label: string }>
  >(() => {
    return config.roles
      .filter((x) => showAllRoles || x.accessByDefault)
      .map((x) => ({
        value: x.id,
        label: x.name,
      }))
  }, [showAllRoles])

  return (
    <div
      className={cn(
        'bg-yellow-50 rounded-sm -mx-4 px-4 py-6',
        props.containerClassName
      )}
    >
      <RadioGroup
        name="offices"
        label="Accessible for"
        value={props.value.visibility}
        options={VISIBILITY_OPTIONS.filter((x) =>
          visibilityTypes.includes(x.value)
        )}
        onChange={onChange('visibility') as (v: string) => void}
      />
      {showAllowedRolesList && (
        <div className="mt-6">
          <CheckboxGroup
            name="roles"
            label="Allowed user roles"
            value={allowedRolesValue}
            options={filteredRoles}
            onChange={onChange('allowedRoles')}
          />
          {!showAllRoles && (
            <LabelWrapper label="">
              <Link onClick={() => setShowAllRoles(true)}>Show all roles</Link>
            </LabelWrapper>
          )}
        </div>
      )}
      {showOfficesList && (
        <div className="mt-6">
          <CheckboxGroup
            name="offices"
            label="List in offices"
            value={officesValue}
            options={config.offices.map((x) => ({
              value: x.id,
              label: `${x.name} ${x.icon || ''}`,
            }))}
            onChange={onChange('offices')}
          />
        </div>
      )}
    </div>
  )
}
