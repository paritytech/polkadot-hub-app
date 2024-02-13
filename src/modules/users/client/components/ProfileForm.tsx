import { useStore } from '@nanostores/react'
import React, { ReactNode } from 'react'
import {
  Avatar,
  FButton,
  H2,
  Input,
  Select,
  Tag,
  Textarea,
  TypeaheadInput,
} from '#client/components/ui'
import { LabelWrapper, TypeaheadInputOption } from '#client/components/ui/Input'
import { showNotification } from '#client/components/ui/Notifications'
import config from '#client/config'
import * as stores from '#client/stores'
import { renderComponent } from '#client/utils/portal'
import {
  ProfileFormData,
  RootComponentProps,
  Tag as TagType,
} from '#shared/types'
import { toggleInArray } from '#client/utils'
import * as fp from '#shared/utils/fp'
import {
  useCitySearchSuggestion,
  useCountries,
  useMetadata,
  useMyTags,
  useUpdateProfile,
} from '../queries'

const EDITABLE_ROLE_GROUPS = config.roleGroups.filter(
  (x) => x.rules.editableByRoles.length
)

type RolesByGroupId = Record<string, string[]>

export const ProfileForm: React.FC<RootComponentProps> = ({ portals }) => {
  const me = useStore(stores.me)
  const [cityQuery, setCityQuery] = React.useState('')
  const [isChanged, setIsChanged] = React.useState(false)
  const [isValid, setIsValid] = React.useState(false)
  const { data: userTags = [] } = useMyTags()
  const [tags, setTags] = React.useState<Array<TagType>>([])
  const [cityValue, setCityValue] = React.useState<
    Array<TypeaheadInputOption | any>
  >([])
  const [state, setState] = React.useState<ProfileFormData>({
    fullName: me?.fullName || '',
    birthday: me?.birthday || '',
    team: me?.team || '',
    jobTitle: me?.jobTitle || '',
    country: me?.country || null,
    city: me?.city || '',
    contacts: me?.contacts || null,
    bio: me?.bio || '',
    geodata: me?.geodata || undefined,
    defaultLocation: me?.defaultLocation || null,
    roles: [], // will be overwritten in the `onSubmitForm` function
  })
  const [rolesByGroupId, setRolesByGroupId] = React.useState<RolesByGroupId>(
    (() => {
      const result: RolesByGroupId = {}
      EDITABLE_ROLE_GROUPS.filter((g) =>
        g.rules.editableByRoles.some(fp.isIn(me?.roles || []))
      ).forEach((g) => {
        result[g.id] = g.roles
          .map(fp.prop('id'))
          .filter(fp.isIn(me?.roles || []))
      })
      return result
    })()
  )

  const { data: countries } = useCountries()
  const { data: citySuggestions = [] } = useCitySearchSuggestion(
    cityQuery,
    state.country
  )

  const { mutate: save } = useUpdateProfile(() => {
    showNotification('You profile has been updated', 'success')
    document.location.href = '/'
  })

  const { data: metadata } = useMetadata()
  const contactsMetadata = metadata?.contacts ?? {}
  const contactsMetadataFields = contactsMetadata
    ? Object.keys(contactsMetadata)
    : []

  const REQUIRED_FIELDS =
    !!metadata && !!Object.keys(metadata).length
      ? Object.keys(metadata)
          .filter((fieldName) => metadata[fieldName]?.required)
          .concat(
            contactsMetadataFields.filter(
              (fieldName) => contactsMetadata[fieldName]?.required
            )
          )
          .concat('fullName')
      : ['fullName']
  const isRequired = (field: string) => REQUIRED_FIELDS.includes(field)

  React.useEffect(() => {
    if (!userTags.length) {
      return
    }
    setTags((v) => {
      if (v.length) {
        setIsChanged(true)
      }
      return userTags
    })
  }, [userTags])

  React.useEffect(() => {
    if (me?.city) {
      setCityValue([
        {
          id: 'fake_id',
          label: me.city,
          data: { timezone: me.geodata?.timezone },
        },
      ])
    }
  }, [me])

  const onChangeForm = React.useCallback(
    (field: keyof ProfileFormData) => (value: any) => {
      setState((x) => ({ ...x, [field]: value }))
      setIsChanged(true)
    },
    []
  )
  const onChangeFormContacts = React.useCallback(
    (field: string) => (value: string) => {
      setState((x) => ({
        ...x,
        contacts: {
          ...x.contacts,
          [field]: value,
        },
      }))
      setIsChanged(true)
    },
    []
  )

  const onSubmitForm = React.useCallback(
    (ev: React.FormEvent) => {
      ev.preventDefault()
      const c = cityValue[0]
      save({
        ...state,
        country: state.country || '',
        city: c ? c.label : '',
        birthday: !state.birthday ? null : state.birthday,
        geodata: {
          doNotShareLocation: state.geodata?.doNotShareLocation || false,
        },
        roles: Object.values(rolesByGroupId).flat(),
      })
    },
    [state, cityValue, rolesByGroupId]
  )
  const onShareLocationChange = () => {
    setState({
      ...state,
      geodata: {
        ...state.geodata,
        doNotShareLocation: !state.geodata?.doNotShareLocation,
      },
    })
    setIsChanged(true)
  }
  const onCountryChange = (value: string | any) => {
    setCityValue([])
    setState({ ...state, country: value })
    setIsChanged(true)
  }
  const onChangeCityQuery = React.useCallback((query: string) => {
    setCityQuery(query)
  }, [])
  const citySuggestionsFormatted = React.useMemo(
    () => citySuggestions.map((x) => ({ id: x.id, label: x.name, data: x })),
    [citySuggestions]
  )
  const onCityChange = (value: Array<TypeaheadInputOption>) => {
    setCityValue(value)
    setIsChanged(true)
  }

  const onToggleRole = React.useCallback(
    (groupId: string, roleId: string) => (ev: React.MouseEvent) => {
      const group = EDITABLE_ROLE_GROUPS.find(fp.propEq('id', groupId))!
      setRolesByGroupId((value) => ({
        ...value,
        [groupId]: toggleInArray(
          value[groupId],
          roleId,
          true,
          group.rules.max,
          true
        ),
      }))
      setIsChanged(true)
    },
    []
  )

  React.useEffect(() => {
    if (
      REQUIRED_FIELDS.every(
        (x) =>
          state[x as keyof ProfileFormData] ||
          (state?.contacts && state?.contacts[x])
      )
    ) {
      setIsValid(true)
    } else {
      setIsValid(false)
    }
  }, [state])

  return (
    <form onSubmit={onSubmitForm} className="mb-0">
      <div>
        <Avatar size="big" src={me?.avatar} className="mx-auto mb-6" />
      </div>
      <Section title={'About'}>
        <Input
          type="text"
          placeholder="John Doe"
          label={'Name'}
          value={state.fullName}
          onChange={onChangeForm('fullName')}
          containerClassName="w-full"
          required={isRequired('fullName')}
        />
        {EDITABLE_ROLE_GROUPS.filter((g) =>
          g.rules.editableByRoles.some(fp.isIn(me?.roles || []))
        ).map((g) => (
          <div key={g.id}>
            <LabelWrapper label={g.name}>
              <div className="flex flex-wrap gap-2">
                <div className="flex flex-wrap -mr-1 -mb-2">
                  {g.roles.map((x) => (
                    <Tag
                      key={x.id}
                      size="normal"
                      color={
                        rolesByGroupId[g.id].includes(x.id) ? 'purple' : 'gray'
                      }
                      className="mb-2 mr-1 cursor-pointer hover:opacity-80"
                      onClick={onToggleRole(g.id, x.id)}
                    >
                      {x.name}
                    </Tag>
                  ))}
                </div>
              </div>
            </LabelWrapper>
          </div>
        ))}
        {metadata?.birthday && (
          <Input
            type="date"
            placeholder=""
            label={metadata.birthday.label}
            value={state.birthday || ''}
            onChange={onChangeForm('birthday')}
            required={isRequired('birthday')}
            containerClassName="w-full"
          />
        )}
        {metadata?.team && (
          <Input
            type="text"
            placeholder={metadata.team.placeholder}
            label={metadata.team.label}
            value={state.team}
            onChange={onChangeForm('team')}
            required={isRequired('team')}
            containerClassName="w-full"
          />
        )}
        {metadata?.jobTitle && (
          <Input
            type="text"
            placeholder={metadata.jobTitle.placeholder}
            label={metadata.jobTitle.label}
            value={state.jobTitle}
            onChange={onChangeForm('jobTitle')}
            required={isRequired('jobTitle')}
            containerClassName="w-full"
          />
        )}

        {metadata?.bio && (
          <Textarea
            name="bio"
            label={metadata.bio.label}
            placeholder={metadata.bio.placeholder}
            value={state.bio}
            onChange={onChangeForm('bio')}
            className={'mb-5'}
            required={isRequired('bio')}
            rows={8}
          />
        )}

        {portals['profile_form_extra_fields']?.map(
          renderComponent({ isOuterFormChanged: isChanged })
        )}

        <LabelWrapper label="Tags">
          <div className="flex flex-col gap-4">
            {!!tags && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Tag key={tag.id} color={'purple'}>
                    {tag.name}
                  </Tag>
                ))}
              </div>
            )}
            <FButton
              kind="secondary"
              onClick={(event: any) => {
                if (!isChanged) {
                  return stores.goTo('profileTags')
                }
                if (
                  window.confirm(
                    'Do you want to continue to editing tags? All unsaved profile changes will be lost.'
                  )
                ) {
                  stores.goTo('profileTags')
                } else {
                  event.preventDefault()
                }
              }}
              className="w-fit"
            >
              {!!tags.length ? 'Edit tags' : 'Add tags'}
            </FButton>
          </div>
        </LabelWrapper>
      </Section>

      {!!contactsMetadataFields.length && (
        <Section title={'Contact information'}>
          {contactsMetadataFields.map((contactId: string) => {
            const contact = contactsMetadata[contactId]
            return (
              <Input
                key={contactId}
                type="text"
                placeholder={contact.placeholder}
                label={contact.label}
                value={state.contacts ? state.contacts[contactId] : ''}
                onChange={(value) =>
                  onChangeFormContacts(contactId)(value as string)
                }
                required={contact.required}
                containerClassName="w-full"
              />
            )
          })}
        </Section>
      )}

      <Section title={'Where are you based?'}>
        <Select
          name="country"
          options={
            countries?.list
              ? countries?.list.map((x) => ({
                  label: `${x.name} ${x.emoji}`,
                  value: x.code,
                }))
              : []
          }
          value={state.country || undefined}
          placeholder="Select a country"
          label="Country"
          className="w-full"
          onChange={onCountryChange}
          required={isRequired('country')}
        />{' '}
        <TypeaheadInput
          maxSelected={1}
          onChangeQuery={onChangeCityQuery}
          suggestedOptions={citySuggestionsFormatted}
          onChange={onCityChange}
          value={cityValue}
          debounceDelay={200}
          label="City"
          preventOptionsColoring
          className="w-full"
        />
        <Input
          type="checkbox"
          label=""
          name="do_not_share_location"
          checked={state.geodata?.doNotShareLocation}
          onChange={onShareLocationChange}
          inlineLabel="I do not want to share my location"
        />
      </Section>

      <hr className="mb-8 py-2" />

      <div className="mt-6">
        <p className="h-6 text-red-400">
          {!isValid &&
            isChanged &&
            'Please check if all required fields are filled in'}
        </p>
        <div className="flex flex-row gap-2 justify-end">
          <FButton
            kind="secondary"
            onClick={() => (window.location.href = '/')}
            className="h-14 px-8 py-[18px]"
          >
            Cancel
          </FButton>
          <FButton
            kind="primary"
            type="submit"
            disabled={!isChanged || !isValid}
          >
            Save
          </FButton>
        </div>
      </div>
    </form>
  )
}

const Section: React.FC<{ title: string; children: ReactNode }> = ({
  title,
  children,
}) => (
  <div className="text-left py-2">
    <hr className="py-2" />
    <H2 className="pt-6 pb-2 mb-0">{title}</H2>
    <div className="flex flex-col gap-4 sm:gap-3 py-6">{children}</div>
  </div>
)
