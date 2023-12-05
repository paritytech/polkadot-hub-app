import * as React from 'react'
import { Link, Icons } from '#client/components/ui'
import { Form } from '#shared/types'
import { useEventWithForm } from '../queries'

type Props = {
  form: Form
}

export const AdminEventFormSubmissionsBadge: React.FC<Props> = ({ form }) => {
  const { data: event = null } = useEventWithForm(form.id)
  return event ? (
    <div className="flex justify-center my-6">
      <div className="flex gap-4 flex-col sm:flex-row sm:items-center bg-yellow-50 p-4 rounded-tiny">
        <Icons.WarningIcon />
        <div>
          This form is attached to the <b>{event.title}</b> event.
          <br />
          In order to manage applications, please go to the{' '}
          <Link href={`/admin/events/${event.id}/applications`}>
            event applications page
          </Link>
          .
        </div>
      </div>
    </div>
  ) : null
}
