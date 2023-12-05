import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import React, {
  createRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useStore } from '@nanostores/react'
import {
  Avatar,
  Button,
  FButton,
  H2,
  H3,
  Input,
  Link,
  RadioGroup,
} from '#client/components/ui'
import config from '#client/config'
import * as stores from '#client/stores'
import {
  EntityVisibility,
  FormBlock,
  FormBlockCondition,
  FormBlockConditions,
  FormData,
  FormSubmissionAnswer,
  PublicForm,
  PublicFormSubmission,
  User,
  UserCompact,
} from '#shared/types'
import { cn } from '#client/utils'
import { eq, propEq } from '#shared/utils/fp'
import { renderMarkdown } from '#client/utils/markdown'
import { useDocumentTitle } from '#client/utils/hooks'
import { LoginButton } from './auth/LoginButton'

dayjs.extend(customParseFormat)

const RequiredFieldErrorText = 'This is a required question'
const FinalFormStepId = '~finish~'
const DateDayFormat = 'DD-MM-YYYY'
const DateTimeFormat = 'DD-MM-YYYY HH:mm'

type Props = {
  loginUrlCallbackPath: string
  form: PublicForm | null
  formFetchingErrorCode: number | null
  formSubmission: PublicFormSubmission | null
  onSubmitForm: (data: FormData) => void
  isFormSubmitted: boolean
  isSubmissionPending: boolean
  formSubmissionErrorCode: number | null

  allowUserSelect: boolean
  users: Array<User | UserCompact>
  selectedUserId: string | null
  onSelectUser: (userId: string | null) => void
}

export const DynamicForm: React.FC<Props> = ({
  formSubmission,
  form,
  onSubmitForm,
  isSubmissionPending,
  loginUrlCallbackPath,
  formFetchingErrorCode,
  formSubmissionErrorCode,
  isFormSubmitted,
  allowUserSelect,
  users,
  selectedUserId,
  onSelectUser,
}) => {
  useDocumentTitle(form?.title || 'Loading...', true)
  const user = useStore(stores.me)
  const [currentStep, setCurrentStep] = useState(0)
  const [formState, setFormState] = useState('form' as 'form' | 'success')
  const [errors, setErrors] = useState({} as Record<string, string | null>)
  const [formData, setFormData] = useState({} as FormData)
  const stepsNumber = useMemo(() => form?.content.length || 0, [form])
  const [initialValueSet, setInitivalValueSet] = useState(false)

  const withFinalStep = useMemo(
    () =>
      (form?.content || []).some((formStep) => formStep.id === FinalFormStepId),
    [form]
  )

  const currentStepBlocks: FormBlock[] = useMemo(() => {
    if (!form) return []
    return form.content[currentStep].blocks || []
  }, [form, currentStep])

  const blocksById: Record<string, FormBlock> = useMemo(() => {
    const result: Record<string, FormBlock> = {}
    if (!form || !form.content?.length) {
      return result
    }
    form.content.forEach((formStep) => {
      if (formStep.id !== FinalFormStepId) {
        formStep.blocks.forEach((block) => {
          result[block.id] = block
        })
      }
    })
    return result
  }, [form])

  const blockRefs = useMemo(() => {
    const result: Record<string, React.RefObject<HTMLDivElement>> = {}
    Object.keys(blocksById).forEach(
      (blockId) => (result[blockId] = createRef())
    )
    return result
  }, [blocksById])

  const conditionalBlocks = useMemo(
    () =>
      (form?.content || [])
        .map((x) => x.blocks)
        .flat()
        .filter((x) => x.conditions),
    [form]
  )

  const resolveConditions = useCallback(
    (conditions: FormBlockConditions = { $and: [], $or: [] }) =>
      _resolveConditions(conditions, formData, blocksById),
    [formData, blocksById]
  )

  const [conditionalBlocksState, setConditionalBlocksState] = useState(
    {} as Record<string, boolean>
  )

  const validateField = useCallback(
    (blockId: string, blockValue: string | string[] | null = null): boolean => {
      const block = blocksById[blockId]
      if (!block) return false
      const value = blockValue || formData[blockId]
      const error = getFormBlockValidationError(block, value)
      setErrors((value) => ({
        ...value,
        [block.id]: error || null,
      }))
      return !error
    },
    [formData, setErrors, blocksById]
  )

  const validateFormStep = useCallback(
    (stepIndex?: number, scrollToInvalidBlock = false): boolean => {
      const blocks = form?.content[stepIndex || currentStep]?.blocks || []
      let isValid = true
      const errors = {} as Record<string, string>
      blocks
        .filter((x) =>
          x.conditions ? x.required && conditionalBlocksState[x.id] : x.required
        )
        .forEach((x) => {
          const value = formData[x.id]
          if (!value) {
            isValid = false
            errors[x.id] = RequiredFieldErrorText
          }
        })
      setErrors(errors)
      if (scrollToInvalidBlock) {
        const firstInvalidBlock = currentStepBlocks.find((block) =>
          Boolean(errors[block.id])
        )
        if (firstInvalidBlock) {
          const ref = blockRefs[firstInvalidBlock.id]
          if (ref?.current?.offsetTop) {
            window.scrollTo({
              top: ref.current.offsetTop - 20,
              behavior: 'smooth',
            })
          }
        }
      }
      return isValid
    },
    [
      form,
      formData,
      currentStep,
      blockRefs,
      currentStepBlocks,
      conditionalBlocksState,
    ]
  )

  useEffect(() => {
    if (isFormSubmitted) {
      setFormState('success')
    }
  }, [isFormSubmitted])

  const sanitizeFormData = useCallback(
    (formData: FormData): FormData => {
      const result: FormData = {}
      Object.keys(formData).forEach((blockId) => {
        const block = blocksById[blockId]
        if (block?.conditions) {
          if (conditionalBlocksState[blockId]) {
            result[blockId] = formData[blockId]
          }
        } else {
          result[blockId] = formData[blockId]
        }
      })
      return result
    },
    [conditionalBlocksState, blocksById]
  )

  const onSubmit = useCallback(
    (ev: React.FormEvent) => {
      ev.preventDefault()
      const isValid = validateFormStep(undefined, true)
      if (!isValid) {
        return
      }
      const data = sanitizeFormData(formData)
      onSubmitForm(data)
    },
    [formData, validateFormStep, onSubmitForm]
  )

  const onPreviousStepClick = useCallback(
    (ev: React.MouseEvent<HTMLButtonElement>) => {
      ev.preventDefault()
      if (currentStep > 0) {
        setCurrentStep(currentStep - 1)
      }
    },
    [currentStep]
  )

  const onNextStepClick = useCallback(
    (ev: React.MouseEvent<HTMLButtonElement>) => {
      ev.preventDefault()
      const isValid = validateFormStep(currentStep, true)
      if (!isValid) {
        return
      }
      const shift = withFinalStep ? 2 : 1
      if (currentStep < stepsNumber - shift) {
        setCurrentStep(currentStep + 1)
      }
    },
    [currentStep, stepsNumber, validateFormStep, withFinalStep]
  )

  const onInputChange = useCallback(
    (blockId: string, isArrayValues = false) => {
      return (
        ev: React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
      ) => {
        const eventValue = ev.target.value
        const currentValue = formData[blockId]
        const value = !isArrayValues
          ? eventValue
          : Array.isArray(currentValue) &&
            (currentValue || []).includes(eventValue)
          ? (currentValue || []).filter((x: string) => x !== eventValue)
          : [...(currentValue || []), eventValue]

        setFormData({ ...formData, [blockId]: value })
        if (errors[blockId]) {
          validateField(blockId, value)
        }
      }
    },
    [errors, setFormData, formData, setErrors]
  )

  const onInputBlur = useCallback(
    (blockId: string) => () => validateField(blockId),
    [validateField]
  )

  // User mode
  const [isUserMode, setIsUserMode] = useState<boolean>(false)
  const onToggleUserMode = useCallback(() => setIsUserMode(true), [])
  const [userQuery, setUserQuery] = useState<string>('')
  const onChangeUserQuery = useCallback((value: any) => setUserQuery(value), [])
  const filteredUsers = useMemo(() => {
    const query = userQuery.toLowerCase()
    if (!query) return users
    return (users || []).filter((x) => {
      return (
        x.fullName.toLowerCase().includes(query) ||
        x.email.toLowerCase().includes(query)
      )
    })
  }, [users, userQuery])
  const selectedUser = React.useMemo(
    () => (selectedUserId ? users.find(propEq('id', selectedUserId)) : null),
    [users, selectedUserId]
  )
  const onCancelUserMode = useCallback(
    (ev: React.MouseEvent<HTMLButtonElement>) => {
      ev.preventDefault()
      onSelectUser(null)
      setIsUserMode(false)
      setUserQuery('')
    },
    []
  )

  useEffect(() => {
    if (formSubmission && !initialValueSet) {
      const initialFormData: FormData = {}
      formSubmission.answers.forEach((answer: FormSubmissionAnswer) => {
        initialFormData[answer.id] = answer.value
      })
      const initialConditionalBlocksState: Record<string, boolean> = {}
      conditionalBlocks.forEach((block) => {
        initialConditionalBlocksState[block.id] = _resolveConditions(
          block.conditions,
          initialFormData,
          blocksById
        )
      })
      setInitivalValueSet(true)
      setConditionalBlocksState(initialConditionalBlocksState)
      setFormData(initialFormData)
    }
  }, [formSubmission, initialValueSet, blocksById, conditionalBlocks])

  useEffect(() => {
    const sanitizedFormData = sanitizeFormData(formData)
    const hasChanged = !compareArrays(
      Object.keys(formData),
      Object.keys(sanitizedFormData)
    )
    if (hasChanged) {
      setFormData(sanitizedFormData)
    }
  }, [formData, conditionalBlocksState])

  useEffect(() => {
    const result: Record<string, boolean> = {}
    conditionalBlocks.forEach((block) => {
      result[block.id] = resolveConditions(block.conditions)
    })
    setConditionalBlocksState(result)
  }, [formData, conditionalBlocks])

  useEffect(() => {
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 30)
  }, [formState, currentStep])

  if (form && form.visibility !== EntityVisibility.UrlPublic && !user) {
    return (
      <Card className="text-center">
        <H2 className="mb-5">To complete the form, please log in</H2>
        <LoginButton size="small" callbackPath={loginUrlCallbackPath} />
      </Card>
    )
  }

  if (form && formState === 'success') {
    const finalStep = withFinalStep
      ? form.content[form.content.length - 1]
      : null
    const finalBlock = finalStep?.blocks[0] || {
      text: `# The form is completed\n\nThank you for your time!`,
    }
    const finalActions = finalStep?.finalActions || []
    return (
      <Card className="mx-4">
        {!!finalBlock.text && (
          <div
            className="phq_markdown-content text-gray-800"
            dangerouslySetInnerHTML={{
              __html: renderMarkdown(finalBlock.text),
            }}
          />
        )}
        {finalActions.length ? (
          <div className="text-center mt-6">
            {finalActions.map((action) => (
              <FButton
                key={action.href}
                href={action.href}
                kind="primary"
                // color="blue"
                rel="external"
              >
                {action.text}
              </FButton>
            ))}
          </div>
        ) : (
          <div className="mt-6">
            {!!user ? (
              <FButton href="/" size="small" kind="primary">
                Back to {config.appName}
              </FButton>
            ) : (
              <div className="flex flex-col gap-2 items-center">
                {config.auth.providers.includes('google') && (
                  <LoginButton
                    size="small"
                    label="Log in with Google"
                    className="whitespace-nowrap"
                  />
                )}
                {config.auth.providers.includes('polkadot') && (
                  // @fixme not showing polkadot button on mobile or tablet as we cannot have browser extension on those
                  <div className="hidden md:block">
                    <LoginButton
                      size="small"
                      icon="polkadot"
                      label="Log in with Polkadot"
                      className="bg-black hover:opacity-80 hover:bg-black whitespace-nowrap"
                      provider="polkadot"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Card>
    )
  }

  if (!form) {
    let header = ''
    let text = 'Loading...'
    if (formFetchingErrorCode) {
      switch (formFetchingErrorCode) {
        case 403: {
          header = '🙅‍♀️'
          text =
            "You don't have an invite yet. Make sure you've received an invitation email and signed in with the same email."
          break
        }
        case 404: {
          header = '404'
          text = 'The requested form is not found.'
          break
        }
        case 409: {
          header = '☝️'
          text = 'This form can only be submitted once.'
          break
        }
        case 410: {
          header = '🙅‍♀️'
          text = 'The requested form is no longer available to fill in.'
          break
        }
        default: {
          header = 'Oops.'
          text = 'Something happened. Please, try again later.'
        }
      }
    }
    return (
      <Card>
        {!!header && <H3 className="mb-5">{header}</H3>}
        {!!text && (
          <div
            className="phq_markdown-content text-gray-800"
            dangerouslySetInnerHTML={{
              __html: renderMarkdown(text),
            }}
          />
        )}
        {!!formFetchingErrorCode && (
          <div className="mt-6">
            <FButton href="/" size="small" kind="primary">
              Back to {config.appName}
            </FButton>
          </div>
        )}
      </Card>
    )
  }

  return (
    <>
      <form onSubmit={onSubmit} className="mx-4">
        {form.content.map(
          (step, stepIndex) =>
            stepIndex === currentStep && (
              <div key={step.id}>
                {!!user && (
                  <div className="text-gray-800 mb-5 flex items-center justify-center">
                    <Avatar
                      src={user.avatar}
                      userId={user.id}
                      size="small"
                      className="mr-2"
                    />
                    <span title={user.email}>{user.fullName}</span>
                    <Link
                      className="ml-3 text-gray-400 hover:text-gray-600"
                      href="/auth/logout"
                      rel="external"
                    >
                      Logout
                    </Link>
                  </div>
                )}
                {allowUserSelect && (
                  <div className="my-5 flex justify-center">
                    {!isUserMode ? (
                      <FButton
                        size="small"
                        kind="secondary"
                        onClick={onToggleUserMode}
                      >
                        Choose the author
                      </FButton>
                    ) : (
                      <Card border="yellow">
                        {selectedUser ? (
                          <div>
                            ☝️ You are filling the form on behalf of{' '}
                            <b>{selectedUser.fullName}</b>{' '}
                            <Button size="small" onClick={onCancelUserMode}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          'Select the user you would like to complete the form for:'
                        )}
                        <div className="bg-white mt-4 rounded">
                          <div className="mx-2 mt-2">
                            <Input
                              type="text"
                              containerClassName="w-full"
                              placeholder="Search by name or email"
                              value={userQuery}
                              onChange={onChangeUserQuery}
                            />
                          </div>
                          <div className="overflow-y-scroll p-2 h-48">
                            <RadioGroup
                              name="___userId"
                              value={selectedUserId}
                              onChange={onSelectUser}
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
                      </Card>
                    )}
                  </div>
                )}
                {step.blocks.map((block) => {
                  const [inputComponent, inputType] = getInputParams(block.kind)
                  const error = errors[block.id] || null
                  let show = true
                  if (block.conditions) {
                    show = conditionalBlocksState[block.id]
                  }
                  return (
                    show && (
                      <Card
                        setRef={blockRefs[block.id]}
                        border={error ? 'red' : undefined}
                        key={block.id}
                      >
                        {block.title && block.type === 'input' && (
                          <div className="mb-2">
                            <b>
                              {block.title}
                              {block.required ? (
                                <span
                                  className="text-red-500"
                                  title={RequiredFieldErrorText}
                                >
                                  &nbsp;*
                                </span>
                              ) : null}
                            </b>
                          </div>
                        )}
                        {block.text && (
                          <div
                            className="phq_markdown-content text-gray-800"
                            dangerouslySetInnerHTML={{
                              __html: renderMarkdown(block.text),
                            }}
                          />
                        )}
                        {block.type === 'input' && (
                          <div className="mt-4">
                            {['checkbox', 'radio'].includes(inputType) ? (
                              (block.options || []).map((option) => (
                                <div key={option.value} className="flex mb-2">
                                  <input
                                    className="border border-gray-300 text-purple-400 focus-visible:ring focus-visible:ring-purple-100 focus:ring focus:ring-purple-100 focus:outline-none w-5 h-5 mr-2 mt-0.5"
                                    type={inputType}
                                    name={block.id}
                                    value={option.value}
                                    defaultChecked={formData[
                                      block.id
                                    ]?.includes(option.value)}
                                    onChange={onInputChange(
                                      block.id,
                                      inputType === 'checkbox'
                                    )}
                                    onBlur={onInputBlur(block.id)}
                                    id={`${block.id}_${inputType}_${option.value}`}
                                  />
                                  <label
                                    className="flex-1"
                                    htmlFor={`${block.id}_${inputType}_${option.value}`}
                                  >
                                    {option.label}
                                  </label>
                                </div>
                              ))
                            ) : (
                              <>
                                {inputComponent === 'input' && (
                                  <>
                                    <input
                                      className="w-full rounded-lg py-3 px-4 border border-applied-separator text-inter focus:border-text-primary focus:outline-0 focus:ring-0 hover:border-applied-overlay disabled:border-applied-separator disabled:text-applied-separator placeholder-text-disabled"
                                      type={inputType}
                                      name={block.id}
                                      value={formData[block.id] || ''}
                                      placeholder={block.placeholder || ''}
                                      onChange={onInputChange(block.id)}
                                      onBlur={onInputBlur(block.id)}
                                    />
                                    {block.kind === 'date' ||
                                    block.kind === 'date_time' ? (
                                      <DateInputPostfix
                                        kind={block.kind}
                                        value={String(formData[block.id] || '')}
                                        className="mt-4"
                                      />
                                    ) : null}
                                  </>
                                )}
                                {inputComponent === 'textarea' && (
                                  <textarea
                                    className="w-full rounded-sm py-3 px-4 border border-applied-separator text-inter focus:border-text-primary focus:outline-0 focus:ring-0 hover:border-applied-overlay disabled:border-applied-separator disabled:text-applied-separator placeholder-text-disabled"
                                    name={block.id}
                                    value={formData[block.id] || ''}
                                    placeholder={block.placeholder || ''}
                                    onChange={onInputChange(block.id)}
                                    onBlur={onInputBlur(block.id)}
                                    rows={4}
                                  ></textarea>
                                )}
                                {inputComponent === 'select' && (
                                  <select
                                    className="w-full py-3 px-4 border border-applied-separator text-inter focus:border-text-primary focus:outline-0 focus:ring-0 hover:border-applied-overlay disabled:border-applied-separator disabled:text-applied-separator placeholder-text-disabled rounded-md pr-9 pl-4"
                                    name={block.id}
                                    required={block.required || false}
                                    onChange={onInputChange(block.id)}
                                    onBlur={onInputBlur(block.id)}
                                    value={formData[block.id] || ''}
                                  >
                                    {[{ value: '', label: block.placeholder }]
                                      .concat(block.options || [])
                                      .map((option, optionIndex) => (
                                        <option
                                          key={option.value}
                                          value={option.value}
                                          disabled={!optionIndex}
                                          hidden={!optionIndex}
                                        >
                                          {option.label}
                                        </option>
                                      ))}
                                  </select>
                                )}
                              </>
                            )}
                            {error ? (
                              <div className="text-red-500 mt-2">{error}</div>
                            ) : null}
                          </div>
                        )}
                      </Card>
                    )
                  )
                })}
                {!!formSubmissionErrorCode && (
                  <FormSubmissionError code={formSubmissionErrorCode} />
                )}
                <div className="flex mt-5">
                  <div className="flex-1">
                    {currentStep !== 0 && (
                      <FButton
                        size="normal"
                        kind="secondary"
                        onClick={onPreviousStepClick}
                      >
                        Back
                      </FButton>
                    )}
                  </div>
                  <div>
                    {currentStep !== stepsNumber - (withFinalStep ? 2 : 1) ? (
                      <FButton
                        size="normal"
                        // color="blue"
                        onClick={onNextStepClick}
                        kind="primary"
                      >
                        Next
                      </FButton>
                    ) : (
                      <FButton
                        size="normal"
                        kind="primary"
                        // color="blue"
                        type="submit"
                        disabled={isSubmissionPending}
                      >
                        {isSubmissionPending ? 'Loading' : 'Submit'}
                      </FButton>
                    )}
                  </div>
                </div>
              </div>
            )
        )}
      </form>
    </>
  )
}

const FormSubmissionError: React.FC<{ code: number }> = ({ code }) => {
  let text = 'Error. Please, try again later'
  switch (code) {
    case 404:
    case 410:
      text = 'The form is no longer available for submission.'
      break
    case 409:
      text = 'This form can only be submitted once.'
      break
  }
  return (
    <Card border="red" className="bg-red-50 text-red-500">
      {text}
      <div className="mt-4">
        <FButton href="/" size="small" kind="secondary">
          Back to {config.appName}
        </FButton>
      </div>
    </Card>
  )
}

const DateInputPostfix: React.FC<{
  kind: 'date' | 'date_time'
  value: string
  className: string
}> = ({ kind, value, className }) => {
  const date = dayjs(value)
  const isValid = date.isValid()
  const format = 'MMMM D, YYYY' + (kind === 'date_time' ? ' HH:mm' : '')
  return (
    <div className={cn('text-gray-400', className)}>
      {isValid ? `Selected date: ${date.format(format)}` : 'No date selected'}
    </div>
  )
}

function _resolveConditions(
  conditions: FormBlock['conditions'] = { $and: [], $or: [] },
  formData: FormData,
  blocksById: Record<string, FormBlock>
): boolean {
  const andConditions = conditions['$and'] || []
  const orConditions = conditions['$or'] || []
  for (const condition of andConditions) {
    const block = blocksById[condition.blockId]
    const value = formData[condition.blockId]
    const match = _resolveCondition(condition, value, block)
    if (!match) {
      return false
    }
  }
  if (orConditions.length) {
    const orConditionMatches = []
    for (const condition of orConditions) {
      const block = blocksById[condition.blockId]
      const value = formData[condition.blockId]
      const match = _resolveCondition(condition, value, block)
      orConditionMatches.push(match)
    }
    if (orConditionMatches.every(eq(false))) {
      return false
    }
  }
  return true
}

function _resolveCondition(
  condition: FormBlockCondition,
  value: string | string[],
  block: FormBlock
): boolean {
  if (!value) {
    return false
  }
  switch (condition.operator) {
    case '$eq': {
      if (Array.isArray(value) && Array.isArray(condition.value)) {
        return compareArrays(value, condition.value)
      } else if (condition.value !== value) {
        return false
      }
      break
    }
    case '$ne': {
      if (condition.value === value) {
        return false
      }
      break
    }
    case '$in': {
      // TODO: support $in operator for checkboxes
      if (!Array.isArray(value) && condition.value.indexOf(value) === -1) {
        return false
      }
      break
    }
    case '$includes': {
      if (
        typeof condition.value === 'string' &&
        value.indexOf(condition.value) === -1
      ) {
        return false
      }
      break
    }
    case '$gt': {
      if (typeof condition.value === 'string') {
        if (
          block.kind === 'number' &&
          Number(condition.value) >= Number(value)
        ) {
          return false
        }
        if (block.kind === 'date' || block.kind === 'date_time') {
          const format = block.kind === 'date' ? DateDayFormat : DateTimeFormat
          const refDate = dayjs(condition.value, format)
          const date = dayjs(String(value))
          if (refDate >= date) {
            return false
          }
        }
      }
      break
    }
    case '$gte': {
      if (typeof condition.value === 'string') {
        if (
          block.kind === 'number' &&
          Number(condition.value) > Number(value)
        ) {
          return false
        }
        if (block.kind === 'date' || block.kind === 'date_time') {
          const format = block.kind === 'date' ? DateDayFormat : DateTimeFormat
          const refDate = dayjs(condition.value, format)
          const date = dayjs(String(value))
          if (refDate > date) {
            return false
          }
        }
      }
      break
    }
    case '$lt': {
      if (typeof condition.value === 'string') {
        if (
          block.kind === 'number' &&
          Number(condition.value) <= Number(value)
        ) {
          return false
        }
        if (block.kind === 'date' || block.kind === 'date_time') {
          const format = block.kind === 'date' ? DateDayFormat : DateTimeFormat
          const refDate = dayjs(condition.value, format)
          const date = dayjs(String(value))
          if (refDate <= date) {
            return false
          }
        }
      }
      break
    }
    case '$lte': {
      if (typeof condition.value === 'string') {
        if (
          block.kind === 'number' &&
          Number(condition.value) < Number(value)
        ) {
          return false
        }
        if (block.kind === 'date' || block.kind === 'date_time') {
          const format = block.kind === 'date' ? DateDayFormat : DateTimeFormat
          const refDate = dayjs(condition.value, format)
          const date = dayjs(String(value))
          if (refDate < date) {
            return false
          }
        }
      }
      break
    }
  }
  return true
}

function getInputParams(
  blockKind: string | undefined
): ['input' | 'select' | 'textarea', string] {
  if (!blockKind) {
    return ['input', 'text']
  }
  let inputComponent: 'input' | 'select' | 'textarea' = 'input'
  let inputType = 'text'
  switch (blockKind) {
    case 'text_long':
      inputComponent = 'textarea'
      break
    case 'email':
      inputType = 'email'
      break
    case 'number':
      inputType = 'number'
      break
    case 'phone':
      inputType = 'tel'
      break
    case 'date':
      inputType = 'date'
      break
    case 'date_time':
      inputType = 'datetime-local'
      break
    case 'select':
      inputComponent = 'select'
      break
    case 'checkbox':
      inputType = 'checkbox'
      break
    case 'radio':
      inputType = 'radio'
      break
    default:
      inputComponent = 'input'
      inputType = 'text'
  }
  return [inputComponent, inputType]
}

function getFormBlockValidationError(
  block: FormBlock,
  value: string | string[]
): null | string {
  if (
    block.required &&
    ((block.kind === 'checkbox' && !value?.length) ||
      (block.kind !== 'checkbox' && !value))
  ) {
    return RequiredFieldErrorText
  }
  return null
}

function compareArrays(a1: Array<unknown>, a2: Array<unknown>) {
  if (a1.length !== a2.length) return false
  const arraySorted1 = a1.slice().sort()
  const arraySorted2 = a2.slice().sort()
  for (let i = 0; i < arraySorted1.length; i++) {
    if (arraySorted1[i] !== arraySorted2[i]) {
      return false
    }
  }
  return true
}

const Card: React.FC<{
  className?: string
  children: React.ReactNode
  border?: 'red' | 'yellow'
  setRef?: any
}> = ({ className, children, border, setRef }) => (
  <div
    ref={setRef || undefined}
    className={cn(
      'bg-bg-primary rounded-sm p-6 mb-1 md:mb-2 border-2 text-base',
      !!border
        ? border === 'red'
          ? 'border-red-500'
          : 'border-yellow-400'
        : 'border-transparent',
      className
    )}
  >
    {children}
  </div>
)
