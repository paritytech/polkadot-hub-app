import React from 'react'
import { useStore } from '@nanostores/react'
import * as stores from '#client/stores'
import { DynamicForm } from '#client/components/DynamicForm'
import { Background, H3, LoaderSpinner } from '#client/components/ui'
import { renderComponent } from '#client/utils/portal'
import { useUsersCompact } from '#modules/users/client/queries'
import Permissions from '#shared/permissions'
import { EntityVisibility, FormData, RootComponentProps } from '#shared/types'
import {
  useFormPublic,
  useFormSubmissionPublic,
  useSubmitForm,
} from '../queries'

export const PublicForm: React.FC<RootComponentProps> = ({ portals }) => {
  const page = useStore(stores.router)
  const permissions = useStore(stores.permissions)
  const formId = React.useMemo(() => {
    if (page?.route === 'form') {
      return page.params.formId
    }
    return null
  }, [page])

  // Load form
  const {
    data: form,
    error: formFetchingError,
    isLoading: isFormLoading,
  } = useFormPublic(formId)
  const formFetchingErrorCode = React.useMemo(
    () => formFetchingError?.response?.status || null,
    [formFetchingError]
  )

  // Load previous submission
  const { data: formSubmission } = useFormSubmissionPublic(formId, {
    enabled: form?.duplicationRule === 'rewrite_edit',
  })

  // Select user as a forms' author
  const allowUserSelect = React.useMemo(
    () => permissions.has(Permissions.forms.AdminManage),
    [permissions, form]
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
  } = useSubmitForm(formId, () => {
    setIsFormSubmitted(true)
  })
  const formSubmissionErrorCode = React.useMemo(
    () => formSubmissionError?.response?.status || null,
    [formSubmissionError]
  )
  const onSubmit = React.useCallback(
    (data: FormData) => {
      if (!form) return
      submitForm({
        data,
        userId: selectedUserId || null,
      })
    },
    [form, submitForm, allowUserSelect, selectedUserId]
  )

  if (!form && isFormLoading) {
    return (
      <Background className="flex items-center justify-center">
        <LoaderSpinner className="h-full w-full" />
      </Background>
    )
  }
  return (
    <Background>
      {portals['public_form_header']?.map(renderComponent({ form }))}

      <div className="pt-12 pb-12 max-w-xl mx-auto">
        {form?.visibility === EntityVisibility.None && (
          <div className="flex justify-center mb-8 mx-4">
            <div className="bg-yellow-50 border-2 border-yellow-400 py-4 px-5 rounded">
              <H3 className="mb-2">DRAFT MODE</H3>
              This form is not visible to anyone. You're seeing this because
              you're an admin.
            </div>
          </div>
        )}
        <DynamicForm
          form={form || null}
          formFetchingErrorCode={formFetchingErrorCode}
          formSubmission={formSubmission || null}
          loginUrlCallbackPath={`/form/${formId}`}
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
