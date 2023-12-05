import React from 'react'
import config from '#client/config'
import { useStore } from '@nanostores/react'
import * as stores from '#client/stores'
import {
  FButton,
  Input,
  ComponentWrapper,
  H1,
  H2,
  ButtonsWrapper,
  Background,
  CheckboxGroup,
} from '#client/components/ui'
import { DatePicker } from '#client/components/DatePicker'
import { showNotification } from '#client/components/ui/Notifications'
import { useVisitConfig } from '#modules/visits/client/queries'
import { GuestInviteGuestRequest } from '#shared/types'
import { toggleInArray } from '#client/utils'
import { propEq } from '#shared/utils/fp'
import {
  useGuestInvitePublic,
  useGuestInviteRules,
  useOpenGuestInvitePublic,
} from '../queries'

type Step = 'loading' | 'invalid' | 'form' | 'success'

export const GuestInviteForm: React.FC = () => {
  const page = useStore(stores.router)
  const inviteCode =
    page?.route === 'guestInviteForm' ? page.params.inviteCode : null
  const { data: invite, isFetching: isInviteFetching } =
    useGuestInvitePublic(inviteCode)
  const { data: inviteRules, isFetching: isInviteRulesFetching } =
    useGuestInviteRules(inviteCode)
  const { data: officeConfig, isFetching: isOfficeConfigFetching } =
    useVisitConfig(invite?.office || null)
  const office = React.useMemo(() => {
    if (!invite) return null
    return config.offices.find(propEq('id', invite.office))
  }, [invite])

  const [step, setStep] = React.useState<Step>('loading')
  React.useEffect(() => {
    if (
      !isInviteFetching &&
      !isInviteRulesFetching &&
      !isOfficeConfigFetching
    ) {
      if (invite) {
        setStep('form')
      } else {
        setStep('invalid')
      }
    }
  }, [invite, isInviteFetching, isInviteRulesFetching, isOfficeConfigFetching])

  const [state, setState] = React.useState<GuestInviteGuestRequest>({
    fullName: '',
    dates: [],
    rules: [],
  })
  const onFormChange = React.useCallback(
    (field: keyof GuestInviteGuestRequest) => (value: any) => {
      setState((x) => ({ ...x, [field]: value }))
    },
    []
  )
  const onToggleDate = React.useCallback((date: string) => {
    setState((state) => ({
      ...state,
      dates: toggleInArray(state.dates, date, false, 5),
    }))
  }, [])
  const { mutate: updateGuestInvite, isLoading } = useOpenGuestInvitePublic(
    inviteCode,
    () => {
      showNotification(
        `The invitation request successfully accepted`,
        'success'
      )
      setStep('success')
    }
  )
  const onSubmit = React.useCallback(
    (ev: React.MouseEvent<HTMLButtonElement>) => {
      ev.preventDefault()
      updateGuestInvite(state)
    },
    [state]
  )

  const isFormValid = React.useMemo(
    () =>
      !!state.fullName &&
      !!state.dates.length &&
      state.rules.length === (inviteRules || []).length,
    [state, inviteRules]
  )

  return (
    <Background className="pt-20">
      <ComponentWrapper>
        {step === 'loading' && 'Loading...'}
        {step === 'form' && (
          <>
            <H1 className="font-extra">
              {office?.icon || ''} {office?.name} office guest visit
            </H1>
            <p className="mb-4">
              Please, complete the following form to request you invitation to
              the {office?.name} office
            </p>
            <form className="block">
              {!!inviteRules?.length && (
                <div>
                  <div className="font-bold mb-4">Rules</div>
                  {/* <p className="mb-4">Please confirm the following:</p> */}
                  <CheckboxGroup
                    name="rules"
                    value={state.rules}
                    options={inviteRules.map((x) => ({
                      value: x.id,
                      label: x.label,
                    }))}
                    onChange={onFormChange('rules')}
                    required
                  />
                </div>
              )}

              <div className="mt-8">
                <div className="font-bold mb-4">Personal details</div>
                <Input
                  type="text"
                  name="fullName"
                  label="Full name"
                  placeholder="John Doe"
                  containerClassName="w-full"
                  onChange={onFormChange('fullName')}
                  required
                />
              </div>

              {!!officeConfig && (
                <div className="mt-8">
                  <H2>Visit dates</H2>
                  {/* <p className='mb-4'>Select desired dates for your visits. Maximum 5 days.</p> */}
                  <DatePicker
                    workingDays={officeConfig.workingDays}
                    availableDateRange={officeConfig?.bookableDays}
                    selectedDates={state.dates}
                    onToggleDate={onToggleDate}
                    preReservedDates={[]}
                    reservedDates={[]}
                  />
                </div>
              )}
              <ButtonsWrapper
                className="mt-8"
                right={[
                  <FButton
                    kind="primary"
                    disabled={!isFormValid || isLoading}
                    onClick={onSubmit}
                  >
                    {isLoading ? 'Loading...' : 'Submit'}
                  </FButton>,
                ]}
              />
            </form>
          </>
        )}
        {step === 'invalid' && (
          <>
            <p>The invitation code is invalid or has already been used</p>
          </>
        )}
        {step === 'success' && (
          <>
            <H1 className="font-extra">Done!</H1>
            <p>
              Thank you for your time. You will receive an email with invitation
              and following instructions soon.
            </p>
            <p>You can close this window now.</p>
          </>
        )}
      </ComponentWrapper>
    </Background>
  )
}
