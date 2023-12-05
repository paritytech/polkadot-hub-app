import * as React from 'react'
import { useStore } from '@nanostores/react'
import { VisitNotice } from './VisitNotice'
import { DateDeskPicker } from './DateDeskPicker'
import { useCreateVisit, useVisitNotice } from '../queries'
import * as stores from '#client/stores'
import { VisitsCreationRequest, VisitRequest } from '#shared/types'
import {
  FButton,
  ComponentWrapper,
  H1,
  P,
  ButtonsWrapper,
} from '#client/components/ui'
import { useDocumentTitle } from '#client/utils/hooks'
import { PermissionsValidator } from '#client/components/PermissionsValidator'
import Permissions from '#shared/permissions'

type VisitRequestStep =
  | 'health_check'
  | 'needs_approval_alert'
  | 'date_desk_picker'
  | 'success'
  | 'wait-for-confirmation'
  | 'needs_confirmation'

export const VisitRequestForm = () => (
  <PermissionsValidator required={[Permissions.visits.Create]} onRejectGoHome>
    <_VisitRequestForm />
  </PermissionsValidator>
)

export const _VisitRequestForm: React.FC = () => {
  useDocumentTitle('Office visit request')
  const officeId = useStore(stores.officeId)
  const request = React.useRef<VisitsCreationRequest>({
    metadata: {},
    status: 'pending',
    officeId: '',
    visits: [],
  })

  const { data: visitNotice } = useVisitNotice(officeId)
  const [step, setStep] = React.useState<VisitRequestStep>()

  const { mutate: createVisit, error } = useCreateVisit(() => {
    setStep(
      request.current.status === 'confirmed'
        ? 'success'
        : 'wait-for-confirmation'
    )
  })

  const onInitialFormSubmit = React.useCallback(() => {
    request.current = {
      ...request.current,
      officeId,
    }
    setStep('date_desk_picker')
  }, [officeId])
  const onAcceptManualProcessing = React.useCallback(
    () => setStep('date_desk_picker'),
    []
  )

  const onDateDeskSubmit = React.useCallback((visits: VisitRequest[]) => {
    request.current.visits = visits
    request.current.status = 'confirmed'
    createVisit(request.current)
  }, [])

  React.useEffect(() => {
    if (!!visitNotice) {
      setStep('health_check')
    } else {
      onInitialFormSubmit()
    }
  }, [visitNotice])

  if (step === 'health_check') {
    return (
      <ComponentWrapper>
        <VisitNotice notice={visitNotice} onSubmit={onInitialFormSubmit} />
      </ComponentWrapper>
    )
  }

  if (step === 'needs_approval_alert') {
    return (
      <ComponentWrapper>
        <H1 className="font-extra">🚨 Manual processing required</H1>
        <P>
          Under current local regulations, your request requires manual
          confirmation from Ops team. You can continue your reservation now, but
          the processing can take up to 24 hours.
        </P>
        <ButtonsWrapper
          right={[
            <FButton onClick={onAcceptManualProcessing} kind="secondary">
              I understand and want to continue
            </FButton>,
            <FButton kind="primary" href="/">
              I&apos;d rather stay home
            </FButton>,
          ]}
        />
      </ComponentWrapper>
    )
  }

  if (step === 'date_desk_picker') {
    return (
      <DateDeskPicker
        officeId={request.current.officeId}
        onSubmit={onDateDeskSubmit}
      />
    )
  }

  if (step === 'success') {
    return (
      <ComponentWrapper>
        <H1 className="font-extra">👍 Done</H1>
        <P>You have successfully booked your place in the office!</P>
        <P>
          If you change your mind on any given day, please cancel your visit so
          that someone else can use the free space.
        </P>
        <ButtonsWrapper
          className="mt-6"
          right={[<FButton href="/">Back to the homepage</FButton>]}
        />
      </ComponentWrapper>
    )
  }
  if (step === 'wait-for-confirmation') {
    return (
      <ComponentWrapper>
        <H1 className="font-extra">🕑 Now wait for confirmation</H1>
        <P>
          Your request for an office visit is submitted but requires manual
          confirmation from the Ops team. Someone will reach out to you via
          Element or Mattermost.
        </P>
        <ButtonsWrapper
          className="mt-6"
          right={[<FButton href="/">Back to the homepage</FButton>]}
        />
      </ComponentWrapper>
    )
  }
  return null
}
