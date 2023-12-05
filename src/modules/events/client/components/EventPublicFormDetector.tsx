import * as React from 'react'
import { Form } from '#shared/types'
import { useEventWithForm } from '../queries'

type Props = {
  form?: Form
}

export const EventPublicFormDetector: React.FC<Props> = ({ form }) => {
  const { data: event = null } = useEventWithForm(form?.id || null)
  React.useEffect(() => {
    if (event) {
      window.location.href = `/event/${event.id}/application`
    }
  }, [event])
  return null
}
