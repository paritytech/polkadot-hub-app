import { useStore } from '@nanostores/react'
import * as React from 'react'
import {
  Accordion,
  Avatar,
  Background,
  ButtonsWrapper,
  ComponentWrapper,
  FButton,
  H1,
  Input,
  InputsWrapper,
  LabelWrapper,
  P,
  ProgressDots,
  Select,
  Tag as TagSpan,
  TypeaheadInput,
  TypeaheadInputOption,
} from '#client/components/ui'
import config from '#client/config'
import * as stores from '#client/stores'
import { ProfileField, OnboardingProfileRequest, Tag } from '#shared/types'
import { toggleInArray } from '#client/utils'
import * as fp from '#shared/utils/fp'
import { PermissionsValidator } from '#client/components/PermissionsValidator'
import Permissions from '#shared/permissions'
import {
  useCitySearchSuggestion,
  useCountries,
  useMetadata,
  useMyTags,
  useSubmitOnboarding,
  useTags,
} from '../queries'

const EDITABLE_ROLE_GROUPS = config.roleGroups.filter(
  (x) => x.rules.editableByRoles.length
)

type RolesByGroupId = Record<string, string[]>

enum ScreenName {
  General = 'General',
  Contacts = 'Contacts',
  Tags = 'Tags',
}

export const Welcome: React.FC = () => (
  <PermissionsValidator
    required={[Permissions.users.UseOnboarding]}
    onRejectGoHome
  >
    <_Welcome />
  </PermissionsValidator>
)

export const _Welcome: React.FC = () => {
  const me = useStore(stores.me)

  const [state, setState] = React.useState<OnboardingProfileRequest>({
    team: me?.team || '',
    jobTitle: me?.jobTitle || '',
    country: me?.country || '',
    city: me?.city || '',
    tagIds: [],
    contacts: me?.contacts ?? {},
    roles: me?.roles || [], // will be overwritten in the `onSubmitForm` function
  })

  const { data: metadata = null, isFetched: isMetadataFetched } = useMetadata()
  const [stepIndex, setStepIndex] = React.useState(0)
  const { data: tags, isFetched: isTagsFetched } = useTags()

  const { mutate: submitOnboarding } = useSubmitOnboarding(() => {
    window.location.href = '/'
  })

  const stepNames = React.useMemo(() => {
    const result = [ScreenName.General]
    if (
      isMetadataFetched &&
      metadata?.contacts &&
      Object.keys(metadata?.contacts).length
    ) {
      result.push(ScreenName.Contacts)
    }
    if (isTagsFetched && tags?.length) {
      result.push(ScreenName.Tags)
    }
    return result
  }, [metadata, isMetadataFetched, tags, isTagsFetched])

  const totalSteps = React.useMemo(() => stepNames.length, [stepNames])

  const onSubmitStep =
    (saveOnly: boolean = false) =>
    (data: Partial<OnboardingProfileRequest>) => {
      const updatedState = { ...state, ...data }
      setState(updatedState)
      if (!saveOnly) {
        if (stepIndex + 1 < totalSteps) {
          setStepIndex(stepIndex + 1)
        } else {
          submitOnboarding(updatedState)
        }
      }
    }

  const onMoveBack = React.useCallback(
    () => setStepIndex(stepIndex - 1),
    [stepIndex]
  )

  const stepComponents = {
    [ScreenName.General]: (
      <GeneralInfo
        formData={fp.pick(['jobTitle', 'country', 'city', 'team', 'roles'])(
          state
        )}
        onSubmit={onSubmitStep()}
      />
    ),
    [ScreenName.Contacts]: metadata?.contacts ? (
      <Contacts
        metadata={metadata?.contacts}
        onSubmit={onSubmitStep()}
        onMoveBack={onMoveBack}
      />
    ) : null,
    [ScreenName.Tags]: (
      <Tags
        tags={tags ?? []}
        presavedTagIds={state.tagIds}
        onMoveBack={onMoveBack}
        onChange={onSubmitStep(true)}
        onSubmit={onSubmitStep()}
      />
    ),
  }

  React.useEffect(() => {
    if (me?.isInitialised) {
      stores.goTo('home')
    }
  }, [me])

  if (!metadata) {
    return
  }

  return (
    <Background color="#101015" className="py-8 md:py-20 px-2">
      <ComponentWrapper wide className="max-w-[874px]">
        <div className="flex justify-between items-start md:items-center  flex-col gap-y-8 md:flex-row">
          <UserBadge />
          <ProgressDots total={totalSteps} value={stepIndex + 1} />
        </div>
        {stepComponents[stepNames[stepIndex]]}
      </ComponentWrapper>
    </Background>
  )
}

type GeneralInfoFormData = Pick<
  OnboardingProfileRequest,
  'city' | 'country' | 'roles'
> &
  Partial<Pick<OnboardingProfileRequest, 'jobTitle' | 'team'>>

const GeneralInfo: React.FC<{
  formData: GeneralInfoFormData
  onSubmit: (value: GeneralInfoFormData) => void
}> = ({ formData, onSubmit }) => {
  const me = useStore(stores.me)
  const [state, setState] = React.useState(formData)
  const [rolesByGroupId, setRolesByGroupId] = React.useState<RolesByGroupId>(
    (() => {
      const result: RolesByGroupId = {}
      EDITABLE_ROLE_GROUPS.filter((g) =>
        g.rules.editableByRoles.some(fp.isIn(me?.roles || []))
      ).forEach((g) => {
        result[g.id] = g.roles
          .map(fp.prop('id'))
          .filter(fp.isIn(formData.roles))
      })
      return result
    })()
  )

  const [cityQuery, setCityQuery] = React.useState('')
  const [cityOption, setCityOption] = React.useState<TypeaheadInputOption[]>([])

  const { data: countriesResponse } = useCountries()
  const { data: citySuggestions = [] } = useCitySearchSuggestion(
    cityQuery,
    state.country
  )

  const { data: metadata } = useMetadata()

  const countries = React.useMemo(() => {
    return (countriesResponse?.list || []).map((x) => ({
      label: `${x.name} ${x.emoji}`,
      value: x.code,
    }))
  }, [countriesResponse])

  const onChangeCityQuery = React.useCallback((query: string) => {
    setCityQuery(query)
  }, [])
  const citySuggestionsFormatted = React.useMemo(
    () => citySuggestions.map((x) => ({ id: x.id, label: x.name })),
    [citySuggestions]
  )
  const onCityChange = React.useCallback(
    (value: Array<TypeaheadInputOption>) => {
      setCityOption(value)
      setState((x) => ({ ...x, city: value[0] ? value[0].label : '' }))
    },
    []
  )
  const onSubmitClick = React.useCallback(
    (ev: React.MouseEvent) => {
      ev.preventDefault()
      onSubmit({ ...state, roles: Object.values(rolesByGroupId).flat() })
    },
    [state, rolesByGroupId]
  )
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
    },
    []
  )

  React.useEffect(() => {
    if (!state.city) {
      setCityOption([])
    }
  }, [state.city])

  React.useEffect(() => {
    if (formData.city) {
      setCityOption([{ id: 'fake_id', label: formData.city }])
    }
  }, [])

  const generalInfoConfigured =
    !!metadata && (metadata.team || metadata.jobTitle)
  return (
    <div>
      <H1 className="my-10">Complete Setting Up Your Profile</H1>
      {generalInfoConfigured && (
        <div className="my-10">
          <FormLabel>General Information</FormLabel>
          <P className="text-text-tertiary mb-4">
            Specify what you're working on for hub members who'll be interested
            in collaborating on new projects.
          </P>

          {EDITABLE_ROLE_GROUPS.filter((g) =>
            g.rules.editableByRoles.some(fp.isIn(me?.roles || []))
          ).map((g) => (
            <div key={g.id} className="mb-4">
              <LabelWrapper label={g.name}>
                <div className="flex flex-wrap gap-2">
                  <div className="flex flex-wrap -mr-1 -mb-2">
                    {g.roles.map((x) => (
                      <TagSpan
                        key={x.id}
                        size="normal"
                        color={
                          rolesByGroupId[g.id].includes(x.id)
                            ? 'purple'
                            : 'gray'
                        }
                        className="mb-2 mr-1 cursor-pointer hover:opacity-80"
                        onClick={onToggleRole(g.id, x.id)}
                      >
                        {x.name}
                      </TagSpan>
                    ))}
                  </div>
                </div>
              </LabelWrapper>
            </div>
          ))}

          {!!metadata?.team && (
            <Input
              label={metadata.team.label}
              name="team"
              type="text"
              placeholder={metadata.team.placeholder}
              value={state.team || ''}
              onChange={(value) =>
                setState((x) => ({ ...x, team: String(value) }))
              }
              containerClassName="w-full"
              className="mb-4"
            />
          )}

          {!!metadata.jobTitle && (
            <Input
              label={metadata.jobTitle.label}
              name="jobTitle"
              type="text"
              placeholder={metadata.jobTitle.placeholder}
              value={state.jobTitle || ''}
              onChange={(value) =>
                setState((x) => ({ ...x, jobTitle: String(value) }))
              }
              containerClassName="w-full"
            />
          )}
        </div>
      )}
      <div className="my-10">
        <FormLabel>What is your permanent location?</FormLabel>
        <P className="text-text-tertiary mb-4">
          By knowing your time zone, hub members can better adjust teamwork and
          meeting times.
        </P>
        <InputsWrapper
          inputs={[
            <Select
              name="country"
              options={countries}
              value={state.country || undefined}
              placeholder="Select Country"
              onChange={(value) =>
                setState((x) => ({
                  ...x,
                  country: String(value),
                  city: '',
                }))
              }
            />,
            <TypeaheadInput
              disabled={!state.country}
              maxSelected={1}
              onChangeQuery={onChangeCityQuery}
              suggestedOptions={citySuggestionsFormatted}
              onChange={onCityChange}
              value={cityOption}
              debounceDelay={200}
              preventOptionsColoring
              placeholder={cityOption.length ? '' : 'Select City'}
            />,
          ]}
        />
      </div>
      <hr className="my-6" />
      <ButtonsWrapper
        right={[
          <FButton size="normal" kind="primary" onClick={onSubmitClick}>
            Next
          </FButton>,
        ]}
      />
    </div>
  )
}

type CompleteField = ProfileField & { id: string }

const Contacts: React.FC<{
  metadata: Record<string, ProfileField>
  onSubmit: (value: { contacts: Record<string, string> }) => void
  onMoveBack: () => void
}> = ({ metadata, onSubmit, onMoveBack }) => {
  const me = useStore(stores.me)
  const metadataFields = Object.keys(metadata)
  const [state, setState] = React.useState<Record<string, string>>({})
  const [isValid, setIsValid] = React.useState(false)

  const requiredFieldsIds: string[] = metadataFields.filter((contactId) => {
    const contactField = metadata[contactId]
    const userRoles = me?.roles || []
    return (
      contactField.required ||
      fp.hasIntersection(contactField.requiredForRoles, userRoles)
    )
  })

  const [selectedFieldIds, setSelectedFieldIds] =
    React.useState<string[]>(requiredFieldsIds)

  const optionalFields: CompleteField[] = React.useMemo(
    () =>
      metadataFields.reduce<CompleteField[]>((acc, contactId) => {
        if (!metadata[contactId].required) {
          acc.push({ ...metadata[contactId], id: contactId })
        }
        return acc
      }, []),
    [metadata]
  )

  const selectedFields = React.useMemo<CompleteField[]>(
    () => selectedFieldIds.map((id) => ({ ...metadata[id], id })),
    [selectedFieldIds]
  )

  const leftFields = React.useMemo<CompleteField[]>(
    () => optionalFields.filter((x) => !!x && !selectedFieldIds.includes(x.id)),
    [selectedFieldIds]
  )

  React.useEffect(() => {
    if (requiredFieldsIds.every((x) => state[x] || (state && state[x]))) {
      setIsValid(true)
    } else {
      setIsValid(false)
    }
  }, [state])

  const onSelectField = React.useCallback(
    (field: string) => (ev: React.MouseEvent) => {
      setSelectedFieldIds((x) => [...x, field])
    },
    []
  )

  const onMoveBackClick = React.useCallback((ev: React.MouseEvent) => {
    ev.preventDefault()
    onMoveBack()
  }, [])

  const onSubmitClick = React.useCallback(
    (ev: React.MouseEvent) => {
      ev.preventDefault()
      onSubmit({ contacts: state })
    },
    [state]
  )

  return (
    <div>
      <H1 className="my-10">
        Add Your Contact Details So That Hub Members Can Reach Out To You
      </H1>
      <div className="my-10">
        {!!selectedFields.length && (
          <div className="mt-6">
            {selectedFields.map((x: ProfileField & { id: string }) => {
              return (
                <Input
                  key={x.id}
                  type="text"
                  name={x.id}
                  placeholder={x.placeholder}
                  value={state[x.id] || ''}
                  onChange={(value) =>
                    setState((s) => ({ ...s, [x.id]: String(value) }))
                  }
                  label={x.label}
                  containerClassName="w-full mb-4"
                  required={requiredFieldsIds.includes(x.id)}
                />
              )
            })}
          </div>
        )}

        {!!leftFields.length && (
          <LabelWrapper label="Add more">
            <div className="flex flex-wrap">
              {leftFields.map((x) => (
                <FButton
                  key={x.id}
                  className="mr-1 mb-1"
                  kind="secondary"
                  onClick={onSelectField(x.id)}
                >
                  {x.label}
                </FButton>
              ))}
            </div>
          </LabelWrapper>
        )}
      </div>

      <hr className="my-6" />
      <ButtonsWrapper
        right={[
          <FButton size="normal" kind="secondary" onClick={onMoveBackClick}>
            Back
          </FButton>,
          <FButton
            disabled={!isValid}
            size="normal"
            kind="primary"
            onClick={onSubmitClick}
          >
            Next
          </FButton>,
        ]}
      />
    </div>
  )
}

type GroupedTags = Array<{ category: string; tags: Tag[] }>
const Tags: React.FC<{
  tags: Tag[]
  presavedTagIds: string[]
  onChange: (value: Pick<OnboardingProfileRequest, 'tagIds'>) => void
  onSubmit: (value: Pick<OnboardingProfileRequest, 'tagIds'>) => void
  onMoveBack: () => void
}> = ({ tags, onSubmit, onMoveBack, onChange, presavedTagIds }) => {
  const { data: userTags = [] } = useMyTags({ retry: false })

  const [selectedTagIds, setSelectedTagIds] =
    React.useState<string[]>(presavedTagIds)

  const groupedTags = React.useMemo<GroupedTags>(() => {
    const tagsByCategory = (tags || []).reduce(fp.groupBy('category'), {})
    return Object.keys(tagsByCategory).map((x) => ({
      category: x,
      tags: tagsByCategory[x],
    }))
  }, [tags])

  const onToggleTag = React.useCallback(
    (tagId: string) => (ev: React.MouseEvent) => {
      ev.preventDefault()
      setSelectedTagIds((ids) => toggleInArray(ids, tagId))
    },
    []
  )

  const onMoveBackClick = React.useCallback((ev: React.MouseEvent) => {
    ev.preventDefault()
    onMoveBack()
  }, [])

  const onSubmitClick = React.useCallback(
    (ev: React.MouseEvent) => {
      ev.preventDefault()
      onSubmit({ tagIds: selectedTagIds })
    },
    [selectedTagIds]
  )

  // DELETE: ?
  React.useEffect(() => {
    if (userTags.length) {
      setSelectedTagIds(userTags.map(fp.prop('id')))
    }
  }, [userTags])

  React.useEffect(() => {
    onChange({ tagIds: selectedTagIds })
  }, [selectedTagIds])

  return (
    <div>
      <H1 className="my-10">Complete Setting Up Your Profile</H1>
      <div className="my-10">
        <P className="text-text-tertiary mt-0 mb-8">
          Tags will help other team members quickly find and understand your
          areas of expertise, making easier to collaborate and share knowledge
          across teams.
        </P>
        {groupedTags.map((group, idx) => (
          <div key={group.category} className="mt-4">
            <Accordion open={!idx} title={group.category}>
              <div className="flex flex-wrap -mb-1">
                {group.tags.map((tag) => (
                  <TagSpan
                    key={tag.id}
                    color={selectedTagIds.includes(tag.id) ? 'purple' : 'gray'}
                    className="mb-1 mr-1 cursor-pointer hover:opacity-80"
                    onClick={onToggleTag(tag.id)}
                  >
                    {tag.name}
                  </TagSpan>
                ))}
              </div>
            </Accordion>
          </div>
        ))}
      </div>

      <hr className="my-6" />
      <ButtonsWrapper
        right={[
          <FButton size="normal" kind="secondary" onClick={onMoveBackClick}>
            Back
          </FButton>,
          <FButton size="normal" kind="primary" onClick={onSubmitClick}>
            {selectedTagIds.length ? 'Done' : 'Skip'}
          </FButton>,
        ]}
      />
    </div>
  )
}

const UserBadge: React.FC = () => {
  const me = useStore(stores.me)
  return (
    <div className="inline-flex rounded-[20px] h-[40px] bg-fill-6 text-text-tertiary items-center">
      <div className="mr-4 pl-4 hidden sm:block">You Logged In As</div>
      {/* FIXME: use colors from tailwind config */}
      <div className="rounded-[20px] h-[40px] bg-[#101015] flex items-center pl-1 pr-5">
        <Avatar src={me?.avatar} size="medium" className="mr-3" />
        <span className="text-[#fff] font-semibold truncate">
          {me?.fullName}
        </span>
      </div>
    </div>
  )
}

const FormLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <P className="text-[24px]">{children}</P>
)
