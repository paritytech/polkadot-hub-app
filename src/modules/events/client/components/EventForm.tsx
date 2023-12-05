import React from 'react'
import { useStore } from '@nanostores/react'
import * as stores from '#client/stores'
import { useFormSubmissionPublic } from '#modules/forms/client/queries'
import { useEventPublic, useSubmitEventForm, useEventForm } from '../queries'
import { useUsersCompact } from '#modules/users/client/queries'
import { DynamicForm } from '#client/components/DynamicForm'
import { Background, H3 } from '#client/components/ui'
import Permissions from '#shared/permissions'
import { EntityVisibility, FormData } from '#shared/types'

export const EventForm: React.FC = () => {
  const permissions = useStore(stores.permissions)
  const page = useStore(stores.router)
  const eventId = React.useMemo(() => {
    if (page?.route === 'eventForm') {
      return page.params.eventId
    }
    return null
  }, [page])

  // Load event
  const { data: event } = useEventPublic(eventId)
  const formId = React.useMemo(() => event?.formId || null, [event])

  // Load form
  const { data: form, error: formFetchingError } = useEventForm(eventId)
  const formFetchingErrorCode = React.useMemo(
    () => formFetchingError?.response?.status || null,
    [formFetchingError]
  )

  // Load previous submission
  const { data: formSubmission } = useFormSubmissionPublic(formId, {
    enabled: !!formId && form?.duplicationRule === 'rewrite_edit',
  })

  // Select user as a forms' author
  const allowUserSelect = React.useMemo(
    () => permissions.has(Permissions.events.AdminManage),
    [permissions]
  )
  const { data: users = [] } = useUsersCompact(undefined, {
    enabled: allowUserSelect,
    retry: false,
  })
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(
    null
  )
  const onSelectUser = React.useCallback(
    (userId: string | null) => setSelectedUserId(userId),
    []
  )

  // Submit handler
  const [isFormSubmitted, setIsFormSubmitted] = React.useState<boolean>(false)
  const {
    mutate: submitForm,
    isLoading: isSubmissionPending,
    error: formSubmissionError,
  } = useSubmitEventForm(eventId, formId, () => {
    setIsFormSubmitted(true)
  })
  const formSubmissionErrorCode = React.useMemo(
    () => formSubmissionError?.response?.status || null,
    [formSubmissionError]
  )
  const onSubmit = React.useCallback(
    (data: FormData) => {
      submitForm({
        data,
        userId: selectedUserId || null,
      })
    },
    [submitForm, allowUserSelect, selectedUserId]
  )

  return (
    <Background>
      <div className="pt-12 pb-12 max-w-xl mx-auto">
        {event?.visibility === EntityVisibility.None && (
          <div className="flex justify-center mb-8">
            <div className="bg-yellow-50 border-2 border-yellow-400 py-4 px-5 rounded">
              <H3 className="mb-2">DRAFT MODE</H3>
              This event and form are not visible to anyone. You're seeing this
              because you're an admin.
            </div>
          </div>
        )}
        <DynamicForm
          form={form || null}
          formFetchingErrorCode={formFetchingErrorCode}
          formSubmission={formSubmission || null}
          loginUrlCallbackPath={`/event/${eventId}/application`}
          onSubmitForm={onSubmit}
          isFormSubmitted={isFormSubmitted}
          isSubmissionPending={isSubmissionPending}
          formSubmissionErrorCode={formSubmissionErrorCode}
          allowUserSelect={allowUserSelect}
          users={users}
          selectedUserId={selectedUserId}
          onSelectUser={onSelectUser}
        />
      </div>
    </Background>
  )
}
