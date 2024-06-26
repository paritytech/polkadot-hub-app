import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useStore } from '@nanostores/react'
import {
  Breadcrumbs,
  Button,
  ButtonsWrapper,
  H1,
  Input,
  MarkdownTextarea,
  WidgetWrapper,
} from '#client/components/ui'
import { showNotification } from '#client/components/ui/Notifications'
import * as stores from '#client/stores'
import { MembershipCreationRequest } from '#shared/types'
import { pick } from '#shared/utils/fp'
import { useDebounce, useDocumentTitle } from '#client/utils/hooks'
import {
  useCreateMembership,
  useMembershipAdmin,
  useUpdateMembership,
} from '../queries'

export const AdminMembershipEditor: React.FC = () => {
  const page = useStore(stores.router)
  const me = useStore(stores.me)
  const membershipId =
    page?.route === 'adminMembership' ? page.params.membershipId : 'new'
  const { data: membership, refetch: refetchMembership } =
    useMembershipAdmin(membershipId)

  useDocumentTitle(
    membershipId !== 'new'
      ? membership?.title || 'Loading...'
      : 'New Membership'
  )

  const requiredFields = React.useMemo<
    Array<keyof Partial<MembershipCreationRequest>>
  >(
    () => [
      'title',
      'description',
      'price',
      'currency',
      'nftCollectionId',
      'durationInDays',
      'image',
    ],
    []
  )
  const [formData, setFormData] = React.useState<MembershipCreationRequest>({
    title: '',
    description: '',
    price: '',
    currency: '',
    nftCollectionId: '',
    offices: [],
    image: '',
    durationInDays: 30,
  })

  const debouncedFormData: MembershipCreationRequest = useDebounce(
    formData,
    1e3
  )
  const formIsValid = React.useMemo<boolean>(() => {
    return requiredFields.every((field) => Boolean(formData[field]))
  }, [requiredFields, debouncedFormData])

  useEffect(() => {
    if (membership) {
      const data = pick([
        'title',
        'description',
        'price',
        'currency',
        'nftCollectionId',
        'durationInDays',
        'offices',
        'image',
      ])(membership)
      setFormData({
        ...data,
      } as MembershipCreationRequest)
    }
  }, [membership])

  const [formIsPristine, setFormIsPristine] = useState<boolean>(true)
  const onFormChange = useCallback(
    (field: keyof MembershipCreationRequest) => (value: any) => {
      setFormData((x) => ({ ...x, [field]: value }))
      console.log({ [field]: value })
      setFormIsPristine(false)
    },
    []
  )

  const { mutate: createMembership, error: createMembershipError } =
    useCreateMembership(() => {
      stores.goTo('adminMemberships')
      showNotification('The membership has been created', 'success')
      setFormIsPristine(true)
    })

  const { mutate: updateMembership, error: updateMembershipError } =
    useUpdateMembership(membershipId, () => {
      // stores.goTo('adminEvents')
      showNotification('The membership has been updated', 'success')
      setFormIsPristine(true)
      refetchMembership()
    })

  const onSubmit = useCallback(
    (ev: React.FormEvent) => {
      ev.preventDefault()
      return membership
        ? updateMembership(formData)
        : createMembership(formData)
    },
    [membership, formData]
  )

  return (
    <WidgetWrapper>
      <Breadcrumbs
        items={[
          { label: 'Memberships', href: '/admin/memberships' },
          { label: membership?.title || 'New membership' },
        ]}
      />
      <form className="mb-0" onSubmit={onSubmit}>
        <H1>
          {membershipId === 'new'
            ? 'New Membership'
            : `Membership "${membership?.title}"`}
        </H1>

        {/* <EntityAccessSelector
          value={{
            // visibility: formData.visibility,
            // allowedRoles: formData.allowedRoles,
            offices: formData.offices,
          }}
          fields={['visibility', 'allowedRoles', 'offices']}
          visibilityTypes={[
            EntityVisibility.None,
            EntityVisibility.Url,
            EntityVisibility.Visible,
          ]}
          onChange={onFormBulkChange}
          containerClassName="my-6"
        /> */}

        <Input
          type="text"
          name="title"
          value={formData.title}
          onChange={onFormChange('title')}
          label="Title"
          placeholder="Unique membership name"
          containerClassName="w-full mb-4"
          required={requiredFields.includes('title')}
        />

        {/* <MarkdownTextarea
          name="description"
          onChangeValue={onFormChange('description')}
          defaultValue={formData.description || ''}
          label="Intro / Description"
          placeholder="A general description of the membersh, so people understand what it is about."
          className="mb-4"
          required={requiredFields.includes('description')}
        /> */}

        <MarkdownTextarea
          name="description"
          onChangeValue={onFormChange('description')}
          defaultValue={formData.description || ''}
          label="Intro / Description"
          placeholder="A general description of the membersh, so people understand what it is about."
          className="mb-4"
          required={requiredFields.includes('description')}
        />

        {/* <Input
          name="startDate"
          type="datetime-local"
          required={requiredFields.includes('startDate')}
          label="Start date"
          value={dayjs(formData.startDate).format(DateFormat)}
          onChange={(date: any) =>
            onFormChange('startDate')(dayjs(date, DateFormat))
          }
          containerClassName="mb-4"
        />

        <Input
          name="endDate"
          type="datetime-local"
          required={requiredFields.includes('endDate')}
          label="End date"
          value={dayjs(formData.endDate).format(DateFormat)}
          onChange={(date: any) =>
            onFormChange('endDate')(dayjs(date, DateFormat))
          }
          containerClassName="mb-4"
        /> */}

        {/* // @todo make this a select */}
        <Input
          name="currency"
          type="text"
          required={requiredFields.includes('currency')}
          label="Currency"
          value={formData.currency || ''}
          onChange={onFormChange('currency')}
          containerClassName="mb-4 w-full"
          placeholder="currency"
        />
        <Input
          name="price"
          type="text"
          required={requiredFields.includes('price')}
          label="Price"
          value={formData.price || ''}
          onChange={onFormChange('price')}
          containerClassName="mb-4 w-full"
          placeholder="price"
        />

        <Input
          name="nftCollectionId"
          type="text"
          required={requiredFields.includes('nftCollectionId')}
          label="NftCollectionId"
          value={formData.nftCollectionId || ''}
          onChange={onFormChange('nftCollectionId')}
          containerClassName="mb-4 w-full"
          placeholder="nftCollectionId"
        />

        {/* // @todo this should be defined differently */}
        <Input
          name="durationInDays"
          type="text"
          required={requiredFields.includes('durationInDays')}
          label="DurationInDays"
          value={formData.durationInDays || ''}
          onChange={onFormChange('durationInDays')}
          containerClassName="mb-4 w-full"
          placeholder="durationInDays"
        />

        {/* <div className="my-6">
          <LabelWrapper label="Direct notifications">
            {!showUsersList ? (
              <Button size="small" onClick={onToggleUsersList}>
                Enable
              </Button>
            ) : (
              <div className="border border-gray-300 rounded-sm">
                <div className="mx-2 mt-2">
                  <Input
                    type="text"
                    containerClassName="w-full"
                    placeholder="Search by name or email"
                    onChange={onChangeUserFilterQuery}
                  />
                </div>
                <div className="overflow-y-scroll p-2 h-48">
                  <CheckboxGroup
                    name="responsibleUserIds"
                    value={formData.responsibleUserIds}
                    onChange={onFormChange('responsibleUserIds')}
                    options={filteredUsers.map((user) => ({
                      value: user.id,
                      label: (
                        <div className="inline-flex items-center">
                          <Avatar
                            src={user.avatar}
                            size="small"
                            className="mr-2"
                          />
                          {user.fullName}
                          <span className="opacity-30 ml-2">
                            ({user.email})
                          </span>
                        </div>
                      ),
                    }))}
                  />
                </div>
              </div>
            )}
          </LabelWrapper>
        </div> */}

        <Input
          label="image"
          type="text"
          value={formData.image || ''}
          placeholder="https://example.com/cover.jpg"
          onChange={onFormChange('image')}
          containerClassName="w-full mb-4"
        />

        <div className="sticky bg-white mt-6 py-4 bottom-0 border-t border-gray-200 px-6 -mx-6 -mb-6 rounded-b-sm">
          <ButtonsWrapper
            right={[
              <Button
                disabled={!formIsValid || formIsPristine}
                type="submit"
                kind="primary"
              >
                {membership ? 'Update membership' : 'Create membership'}
              </Button>,
            ]}
          />
        </div>
      </form>
    </WidgetWrapper>
  )
}
