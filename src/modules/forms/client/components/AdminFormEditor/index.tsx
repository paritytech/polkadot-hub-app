import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useStore } from '@nanostores/react'
import config from '#client/config'
import * as stores from '#client/stores'
import {
  FormStep,
  FormCreationRequest,
  EntityVisibility,
  FormDuplicationRule,
} from '#shared/types'
import { cn, generateId } from '#client/utils'
import { propNotEq } from '#shared/utils/fp'
import { useDebounce, useDocumentTitle } from '#client/utils/hooks'
import {
  Input,
  RadioGroup,
  Avatar,
  Textarea,
  H1,
  ButtonsWrapper,
  Button,
  CheckboxGroup,
  Breadcrumbs,
  LabelWrapper,
  Select,
} from '#client/components/ui'
import { showNotification } from '#client/components/ui/Notifications'
import { EntityAccessSelector } from '#client/components/EntityAccessSelector'
import { finalFormStepId } from './helpers'
import { FormBuilder } from './FormBuilder'
import {
  useForm,
  useCreateForm,
  useUpdateForm,
  useResponsibleUsers,
} from '../../queries'

const EmptyFormContent: FormStep[] = []
const DefaultFormContent: FormStep[] = getPlaceholderFormContent()

type FormFormData = Omit<
  FormCreationRequest,
  'content' | 'purgeSubmissionsAfterDays'
> & {
  contentHash?: number
  purgeSubmissionsAfterDays: string
}

export const AdminFormEditor: React.FC = () => {
  const page = useStore(stores.router)
  const formId = page?.route === 'adminForm' ? page.params.formId : 'new'

  const { data: users } = useResponsibleUsers()
  const [userFilterQuery, serUserFilterQuery] = useState<string>('')
  const filteredUsers = useMemo(() => {
    const query = userFilterQuery.toLowerCase()
    return (users || []).filter((x) => {
      return (
        x.fullName.toLowerCase().includes(query) ||
        x.email.toLowerCase().includes(query)
      )
    })
  }, [users, userFilterQuery])
  const onChangeUserFilterQuery = useCallback(
    (value: any) => serUserFilterQuery(value),
    []
  )

  const [formContent, setFormContent] = useState(
    formId === 'new' ? DefaultFormContent : EmptyFormContent
  )
  const { data: form, refetch: refetchForm } =
    formId !== 'new'
      ? useForm(formId, { retry: false })
      : { data: null, refetch: () => null }

  useDocumentTitle(formId === 'new' ? 'New Form' : form?.title || 'Loading...')

  useEffect(() => {
    if (!form) {
      setFormContent(DefaultFormContent)
    } else {
      setFormContent(form.content || EmptyFormContent)
      setFormData((x) => ({
        ...x,
        title: form.title,
        description: form.description,
        duplicationRule: form.duplicationRule,
        metadataFields: form.metadataFields,
        responsibleUserIds: form.responsibleUserIds,
        visibility: form.visibility,
        allowedRoles: form.allowedRoles,
        purgeSubmissionsAfterDays: String(
          form.purgeSubmissionsAfterDays ?? 'none'
        ),
      }))
      if (form.responsibleUserIds?.length) {
        setShowUsersList(true)
      }
    }
  }, [form])

  const [formContentChanged, setFormContentChanged] = useState([] as FormStep[])
  useEffect(() => {
    setFormContentChanged(form?.content || EmptyFormContent)
  }, [form])

  const requiredFields = React.useMemo<Array<keyof Partial<FormFormData>>>(
    () => ['title', 'duplicationRule'],
    []
  )

  const formInitialValue: FormFormData = useMemo(() => {
    return {
      title: '',
      description: '',
      duplicationRule: FormDuplicationRule.Write,
      metadataFields: [],
      responsibleUserIds: [],
      contentHash: 0,
      visibility: EntityVisibility.None,
      allowedRoles: [],
      purgeSubmissionsAfterDays: 'none',
    }
  }, [])
  const [formData, setFormData] = useState<FormFormData>(formInitialValue)
  const debouncedFormData: FormFormData = useDebounce(formData, 1e3)
  const formIsValid = React.useMemo<boolean>(() => {
    return requiredFields.every((field) => Boolean(formData[field]))
  }, [requiredFields, debouncedFormData])
  const [formIsPristine, setFormIsPristine] = useState<boolean>(true)

  const initialChangeSkipped = React.useRef<boolean>(false)

  const onFormChange = useCallback(
    (field: keyof FormFormData) => (value: any) => {
      setFormData((x) => ({ ...x, [field]: value }))
      setFormIsPristine(false)
    },
    []
  )

  const onFormBulkChange = React.useCallback((data: Record<string, any>) => {
    setFormData((x) => ({ ...x, ...data }))
    setFormIsPristine(false)
  }, [])

  const onFormContentChange = useCallback(
    (content: FormStep[]) => {
      if (initialChangeSkipped.current) {
        setFormData((x) => ({ ...x, contentHash: Date.now() }))
        setFormContentChanged(content)
        setFormIsPristine(false)
      } else {
        initialChangeSkipped.current = true
      }
    },
    [initialChangeSkipped]
  )

  const [showUsersList, setShowUsersList] = useState<boolean>(false)
  const onToggleUsersList = useCallback(() => setShowUsersList((x) => !x), [])

  const onAddMetadataField = useCallback(
    (ev: React.MouseEvent<HTMLButtonElement>) => {
      ev.preventDefault()
      setFormData((x) => ({
        ...x,
        metadataFields: [
          ...x.metadataFields,
          { id: generateId(8, 'mdf_'), label: '' },
        ],
      }))
      setFormIsPristine(false)
    },
    []
  )
  const onChangeMetadataField = useCallback(
    (fieldId: string) => (value: any) => {
      setFormData((x) => ({
        ...x,
        metadataFields: x.metadataFields.map((f) =>
          f.id === fieldId
            ? {
                ...f,
                label: value,
              }
            : f
        ),
      }))
      setFormIsPristine(false)
    },
    []
  )
  const onRemoveMetadataField = useCallback(
    (fieldId: string) => (ev: React.MouseEvent<HTMLButtonElement>) => {
      ev.preventDefault()
      setFormData((x) => ({
        ...x,
        metadataFields: x.metadataFields.filter(propNotEq('id', fieldId)),
      }))
      setFormIsPristine(false)
    },
    []
  )

  const { mutate: createForm, error: createFormError } = useCreateForm(() => {
    stores.goTo('adminForms')
    showNotification('The form has been created', 'success')
    initialChangeSkipped.current = false
    setFormIsPristine(true)
  })

  const { mutate: updateForm, error: updateFormError } = useUpdateForm(
    form?.id || null,
    () => {
      // stores.goTo('adminForms')
      showNotification('The form has been updated', 'success')
      setFormContentChanged([])
      refetchForm()
      initialChangeSkipped.current = false
      setFormIsPristine(true)
    }
  )

  // const submitError = useMemo(() => {
  //   return createFormError || updateFormError || null
  // }, [createFormError, updateFormError])

  const onSubmit = useCallback(
    (ev: React.FormEvent) => {
      ev.preventDefault()
      const values = { ...formData }
      delete values.contentHash
      const contentFallback = form ? form.content : []
      const formRequestData: FormCreationRequest = {
        ...values,
        purgeSubmissionsAfterDays:
          values.purgeSubmissionsAfterDays === 'none'
            ? null
            : Number(values.purgeSubmissionsAfterDays),
        content: formContentChanged || contentFallback,
      }
      if (
        form &&
        formRequestData.purgeSubmissionsAfterDays &&
        !form.purgeSubmissionsAfterDays &&
        !window.confirm(
          `You are about to activate the auto-delete feature for all form submissions older than ${formRequestData.purgeSubmissionsAfterDays} days. This action will take effect soon and could impact previously collected submissions. Are you sure?`
        )
      ) {
        return
      }
      return form ? updateForm(formRequestData) : createForm(formRequestData)
    },
    [form, formContentChanged, formData]
  )

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Forms', href: '/admin/forms' },
          { label: form?.title || 'New form' },
        ]}
      />
      <form className="mb-0" onSubmit={onSubmit}>
        <H1>{formId === 'new' ? 'New form' : `Form "${form?.title}"`}</H1>

        <EntityAccessSelector
          value={{
            visibility: formData.visibility,
            allowedRoles: formData.allowedRoles,
          }}
          fields={['visibility', 'allowedRoles']}
          visibilityTypes={[
            EntityVisibility.None,
            EntityVisibility.Url,
            EntityVisibility.UrlPublic,
          ]}
          onChange={(values) => {
            onFormBulkChange({
              ...values,
              ...(values.visibility === EntityVisibility.UrlPublic
                ? { duplicationRule: FormDuplicationRule.Write }
                : {}),
            })
          }}
          containerClassName="my-6"
        />

        {formData.visibility === EntityVisibility.UrlPublic && (
          <LabelWrapper label="" className="my-6">
            <div className="text-gray-400">
              Please note, that people outside of {config.appName} are able to
              submit the form anonymously.
            </div>
          </LabelWrapper>
        )}

        <Input
          type="text"
          name="title"
          value={formData.title}
          onChange={onFormChange('title')}
          label="Title"
          placeholder="Unique form name"
          containerClassName="w-full mb-4"
          required={requiredFields.includes('title')}
        />

        <Textarea
          name="description"
          onChange={onFormChange('description')}
          value={formData.description || ''}
          label="Description"
          placeholder="Form description (not public)"
          className="mb-4"
          required={requiredFields.includes('description')}
        />

        {formData.visibility !== EntityVisibility.UrlPublic && (
          <RadioGroup
            name="duplicationRule"
            onChange={onFormChange('duplicationRule')}
            value={formData.duplicationRule}
            label="Action on repeat submission"
            options={[
              { value: 'reject', label: 'Reject' },
              { value: 'rewrite', label: 'Rewrite' },
              { value: 'rewrite_edit', label: 'Rewrite previous data' },
              { value: 'write', label: 'Create many' },
            ]}
            containerClassName="mb-4"
            required={requiredFields.includes('duplicationRule')}
          />
        )}

        <div className="my-6">
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
        </div>

        <div className="my-6">
          <LabelWrapper className="my-6 mt-2" label="Metadata fields">
            <div className="flex flex-col mt-4">
              <Button
                className="w-fit mb-4"
                size="small"
                onClick={onAddMetadataField}
              >
                Add
              </Button>
              {formData.metadataFields.map((field) => (
                <div className="flex items-center mb-2" key={field.id}>
                  <Input
                    type="text"
                    value={field.label}
                    placeholder="Field label"
                    onChange={onChangeMetadataField(field.id)}
                    containerClassName="mr-4"
                  />
                  <Button
                    size="small"
                    onClick={onRemoveMetadataField(field.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </LabelWrapper>
        </div>

        <div className="my-6">
          <LabelWrapper className="my-6 mt-2" label="Data retention">
            <Select
              options={[
                { value: 'none', label: 'Keep forever' },
                { value: '30', label: 'Delete after 30 days' },
                { value: '90', label: 'Delete after 90 days' },
                { value: '365', label: 'Delete after 365 days' },
              ]}
              value={formData.purgeSubmissionsAfterDays || 'none'}
              onChange={onFormChange('purgeSubmissionsAfterDays')}
            />
          </LabelWrapper>
        </div>

        <div className="my-6">
          <b className="block mb-6">Content</b>
          <FormBuilder
            defaultSteps={formContent}
            onChange={onFormContentChange}
            isNew={!form}
          />
        </div>

        <div className="sticky bg-white mt-6 py-4 bottom-0 border-t border-gray-200 px-8 -mx-8 -mb-8">
          <ButtonsWrapper
            right={[
              <Button
                type="submit"
                kind="primary"
                disabled={!formIsValid || formIsPristine}
              >
                {form ? 'Update form' : 'Create form'}
              </Button>,
            ]}
          />
        </div>
      </form>
    </>
  )
}

function getPlaceholderFormContent(): FormStep[] {
  return [
    {
      id: generateId(8, 'step_'),
      blocks: [
        {
          id: generateId(8, 'block_'),
          type: 'content',
          kind: 'text',
          text: `# Form title\n\nForm description`,
        },
        {
          id: generateId(8, 'block_'),
          type: 'input',
          kind: 'text',
          title: 'What is your name?',
          label: 'Name',
          placeholder: 'John Doe',
          required: false,
        },
      ],
    },
    {
      id: finalFormStepId,
      blocks: [
        {
          id: finalFormStepId,
          type: 'content',
          text: `# Form completed\n\nThank you for your time!`,
        },
      ],
    },
  ]
}
