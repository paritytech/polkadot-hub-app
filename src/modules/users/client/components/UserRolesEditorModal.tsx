import * as React from 'react'
import config from '#client/config'
import {
  Tag as TagSpan,
  UserLabel,
  Modal,
  FButton,
  ButtonsWrapper,
} from '#client/components/ui'
import { User } from '#shared/types'
import * as fp from '#shared/utils/fp'
import { USER_ROLE_BY_ID } from '#client/constants'
import { toggleInArray } from '#client/utils'

type GroupedRoleIds = Record<string, string[]>

export const UserRolesEditorModal: React.FC<{
  user: User
  onClose: () => void
  onChange: (roles: string[]) => void
}> = ({ user, ...props }) => {
  const [changed, setChanged] = React.useState(false)
  const [unsupportedRoleIds, setUnsupportedRoleIds] = React.useState<string[]>(
    user.roles.filter((x) => !USER_ROLE_BY_ID[x])
  )
  const [groupedRoleIds, setGroupedRoleIds] = React.useState<GroupedRoleIds>(
    (() => {
      const res: GroupedRoleIds = {}
      config.roleGroups.forEach((g) => {
        res[g.id] = g.roles
          .filter(fp.propIn('id', user.roles))
          .map(fp.prop('id'))
      })
      return res
    })()
  )

  const unsupportedUserRoles = React.useMemo(() => {
    return unsupportedRoleIds.map((x) => ({
      id: x,
      name: x,
      accessByDefault: false,
      lowPriority: false,
    }))
  }, [unsupportedRoleIds])

  const onToggleRole = React.useCallback(
    (groupId: string, roleId: string) => (ev: React.MouseEvent) => {
      ev.preventDefault()
      setChanged(true)
      const rules = config.roleGroups.find(fp.propEq('id', groupId))!.rules
      setGroupedRoleIds((value) => {
        return {
          ...value,
          [groupId]: toggleInArray(
            value[groupId],
            roleId,
            false,
            rules.max || undefined,
            true
          ),
        }
      })
    },
    []
  )

  const onToggleUnsupportedRole = React.useCallback(
    (roleId: string) => (ev: React.MouseEvent) => {
      ev.preventDefault()
      setChanged(true)
      setUnsupportedRoleIds((ids) => toggleInArray(ids, roleId))
    },
    []
  )

  const onCloseSafe = React.useCallback(() => {
    if (changed) {
      if (window.confirm('You have unsaved changes. Close anyway?')) {
        props.onClose()
      }
      return
    }
    props.onClose()
  }, [props.onClose, changed])

  const onSave = React.useCallback(() => {
    props.onChange([
      ...unsupportedRoleIds,
      ...Object.values(groupedRoleIds).flat(),
    ])
    props.onClose()
  }, [props.onChange, props.onClose, groupedRoleIds, unsupportedRoleIds])

  return (
    <Modal title="Roles editor" size="normal" onClose={onCloseSafe}>
      <div className="mb-6">
        <UserLabel user={user} />
      </div>

      {!!unsupportedUserRoles.length && (
        <div className="mb-12">
          <div className="mb-2">
            <div className="font-semibold">Unsupported roles</div>
            <div className="text-sm text-text-disabled">
              The following roles are not supported by the current configuration
              of the app. You can only deselect them. Make sure that these roles
              are not used in other parts of the app.
            </div>
          </div>
          <div className="flex flex-wrap -mr-1 mb-3">
            {unsupportedUserRoles.map((x) => (
              <TagSpan
                key={x.id}
                size="normal"
                color="red"
                className="mb-2 mr-1 cursor-pointer hover:opacity-80"
                onClick={onToggleUnsupportedRole(x.id)}
              >
                {x.name}{' '}
                <span className="text-text-disabled italic">UNSUPPORTED</span>
              </TagSpan>
            ))}
          </div>
        </div>
      )}

      {config.roleGroups.map((g, i) => (
        <div key={g.id} className="mb-4">
          {!!i && <hr className="mb-4" />}
          <div className="mb-2">
            <div className="font-semibold">{g.name}</div>
            <div className="text-sm">
              {!!g.rules.max && (
                <span className="text-text-disabled">
                  Only {g.rules.max} role{g.rules.max > 1 && 's'} can be
                  selected.{' '}
                </span>
              )}
              {!!g.rules.unique && (
                <span className="text-text-disabled">
                  Unique role per user.{' '}
                </span>
              )}
              {!!g.rules.editableByRoles.length && (
                <div className="text-text-disabled">
                  Users with the following roles can change these roles in the
                  profile form:{' '}
                  {g.rules.editableByRoles
                    .map((x) => USER_ROLE_BY_ID[x].name)
                    .join(', ')}
                  .
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap -mr-1 mb-3">
            {g.roles.map((x) => (
              <TagSpan
                key={x.id}
                size="normal"
                color={groupedRoleIds[g.id].includes(x.id) ? 'blue' : 'gray'}
                className="mb-2 mr-1 cursor-pointer hover:opacity-80"
                onClick={onToggleRole(g.id, x.id)}
              >
                {x.name}
              </TagSpan>
            ))}
          </div>
        </div>
      ))}

      <ButtonsWrapper
        right={[
          <FButton kind="secondary" onClick={props.onClose}>
            Cancel
          </FButton>,
          <FButton kind="primary" onClick={onSave} disabled={!changed}>
            Save
          </FButton>,
        ]}
      />
    </Modal>
  )
}
