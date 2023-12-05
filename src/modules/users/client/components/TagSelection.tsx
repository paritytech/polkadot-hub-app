import {
  Accordion,
  ComponentWrapper,
  FButton,
  H1,
  Link,
  P,
  Tag as TagSpan,
  HR,
} from '#client/components/ui'
import { showNotification } from '#client/components/ui/Notifications'
import { PermissionsValidator } from '#client/components/PermissionsValidator'
import * as stores from '#client/stores'
import { toggleInArray } from '#client/utils'
import { prop } from '#shared/utils/fp'
import { useDocumentTitle } from '#client/utils/hooks'
import React from 'react'
import { useGroupedTags, useMyTags, useUpdateUserTags } from '../queries'
import Permissions from '#shared/permissions'

export const TagSelection = () => (
  <PermissionsValidator
    required={[Permissions.users.ManageProfile]}
    onReject={() => stores.goTo('profile')}
  >
    <_TagSelection/>
  </PermissionsValidator>
)

const _TagSelection: React.FC = () => {
  useDocumentTitle('Your profile')
  const { data: tags, isFetched: tagsFetched } = useGroupedTags()
  const { data: userTags = [], isFetched: userTagsFetched } = useMyTags()
  const { mutate: updateUserTags } = useUpdateUserTags(() => {
    showNotification('Your tags were updated successfully', 'success')
    stores.goTo('profile')
  })
  const [openGroups, setOpenGroups] = React.useState<string[]>([])

  const [selectedTagIds, setSelectedTagIds] = React.useState<string[]>([])
  const [changed, setChanged] = React.useState(false)

  React.useEffect(() => {
    if (userTagsFetched && tagsFetched) {
      if (userTags.length) {
        setOpenGroups([...new Set(userTags.map((tag) => tag.category))])
        setSelectedTagIds(userTags.map(prop('id')))
      } else if (tags?.length) {
        setOpenGroups([tags[0].category])
      }
    }
  }, [userTagsFetched, tagsFetched])

  const onToggleTag = React.useCallback(
    (tagId: string) => (ev: React.MouseEvent) => {
      ev.preventDefault()
      setSelectedTagIds((ids) => toggleInArray(ids, tagId))
      setChanged(true)
    },
    []
  )
  const onSubmit = React.useCallback(
    (ev: React.MouseEvent) => {
      ev.preventDefault()
      updateUserTags(selectedTagIds)
    },
    [selectedTagIds]
  )

  return (
    <ComponentWrapper>
      <div className="text-center">
        <Link href="/me">Back</Link>
      </div>
      <H1 className="mt-4 text-left leading-[44px] text-xl capitalize mb-4">
        Pick Five Or More Tags That Represent You Skills or Interests
      </H1>
      <P className="text-text-tertiary m-0 mb-8">
        Tags will help other team members quickly find and understand your areas
        of expertise, making easier to collaborate and share knowledge across
        teams.
      </P>
      {tagsFetched && tags && (
        <div>
          {tags.map((group, idx) => (
            <div
              key={group.category}
              className="mt-4"
            >
              <Accordion
                open={openGroups.includes(group.category)}
                title={group.category}
              >
                <div className="flex flex-wrap -mb-2">
                  {group.tags.map((tag) => (
                    <TagSpan
                      key={tag.id}
                      color={
                        selectedTagIds.includes(tag.id) ? 'purple' : 'gray'
                      }
                      className="mb-2 mr-1 cursor-pointer hover:opacity-80"
                      onClick={onToggleTag(tag.id)}
                    >
                      {tag.name}
                    </TagSpan>
                  ))}
                </div>
              </Accordion>
            </div>
          ))}
          <HR className="mt-8 mb-6" />
          <div className="flex justify-between">
            <FButton
              kind="secondary"
              onClick={() => (window.location.href = '/me')}
              size="normal"
            >
              Cancel
            </FButton>
            <FButton disabled={!changed} kind="primary" onClick={onSubmit}>
              Save
            </FButton>
          </div>
        </div>
      )}
    </ComponentWrapper>
  )
}
