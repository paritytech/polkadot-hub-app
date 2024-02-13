import { cn, toggleInArray } from '#client/utils'
import { useDebounce, useFocusInputHotkey } from '#client/utils/hooks'
import React, { ReactNode } from 'react'
import { Button } from './Button'

type InputType =
  | 'checkbox'
  | 'date'
  | 'datetime-local'
  | 'email'
  | 'hidden'
  | 'month'
  | 'number'
  | 'password'
  | 'radio'
  | 'range'
  | 'search'
  | 'tel'
  | 'text'
  | 'time'
  | 'url'
  | 'week'

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  type: InputType
  label?: string
  inlineLabel?: string | React.ReactNode
  onChange?: (value: string | boolean) => void
  containerClassName?: string
}

const labeledTypes = ['checkbox', 'radio']
type LabelProps = {
  name?: string | undefined
  label: string | React.ReactNode | undefined
  required?: boolean | undefined
  type?: string | undefined
  extraLabel?: string | null
  children: ReactNode
  className?: string
}

const Label: React.FC<
  Pick<LabelProps, 'label' | 'required' | 'extraLabel' | 'className'>
> = ({ label, required, extraLabel, className = '' }) => {
  return (
    <div
      className={cn(
        'text-text-tertiary text-base h-auto sm:w-36 sm:mb-0 flex-shrink-0 leading-6',
        className
      )}
    >
      {label}
      {required ? <span className="text-red-400 ml-0.5">*</span> : null}
      {extraLabel && <span className="ml-1">{extraLabel}</span>}
    </div>
  )
}
export const LabelWrapper: React.FC<LabelProps> = ({
  label,
  required = false,
  type,
  extraLabel,
  children,
  name,
  className,
}) => {
  if (label === undefined) {
    return null
  }
  return (
    <div
      className={cn(
        'flex flex-col items-baseline sm:flex-row flex-grow gap-1 sm:gap-4',
        className
      )}
    >
      <Label extraLabel={extraLabel} label={label} required={required} />
      {type && labeledTypes.includes(type) ? (
        <label
          htmlFor={`input_${type}_${name}_${label}`}
          className="flex items-start"
        >
          {children}
        </label>
      ) : (
        children
      )}
    </div>
  )
}

const focus = 'focus:border-text-primary focus:outline-0 focus:ring-0'
const hover = 'hover:border-applied-overlay'
const disabled =
  'disabled:border-applied-separator disabled:text-applied-separator'
const COMMON_INPUT_STYLE = `w-full rounded-lg py-3 px-4 border border-applied-separator text-inter ${focus} ${hover} ${disabled} placeholder-text-disabled`

const getExtraClassName = (type: InputType): string => {
  const className =
    'border border-gray-300 text-purple-400 focus-visible:ring focus-visible:ring-purple-100 focus:ring focus:ring-purple-100 focus:outline-none'
  switch (type) {
    case 'radio':
      return className
    case 'checkbox':
      return cn(
        'rounded disabled:cursor-not-allowed disabled:opacity-60',
        className
      )
    default:
      return COMMON_INPUT_STYLE
  }
}

export const Input: React.FC<Props> = ({
  className,
  containerClassName,
  onChange,
  value,
  label,
  inlineLabel,
  ...props
}) => {
  const onChangeHandler = React.useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      if (!onChange) return
      let value: string | boolean
      switch (props.type) {
        case 'radio':
        case 'checkbox': {
          value = !props.checked
          break
        }
        default: {
          value = ev.target.value
        }
      }
      onChange(value)
    },
    [onChange]
  )
  const isLabeledType = labeledTypes.includes(props.type)
  let inputWrapperClassname = cn(
    isLabeledType && 'w-[22px] sm:w-auto pt-1 mr-2',
    containerClassName
  )

  if (isLabeledType) {
    props.id = `input_${props.type}_${props.name}_${value}`
  }
  if (label === '') {
    inputWrapperClassname = cn(inputWrapperClassname, 'sm:ml-40')
  }
  const getInput = () => (
    <div className={inputWrapperClassname}>
      <input
        className={cn(getExtraClassName(props.type), className)}
        onChange={onChangeHandler}
        value={value}
        {...props}
      />
    </div>
  )

  const getInlineLabel = () => (
    <label htmlFor={props.id} className="hover:cursor-pointer">
      {inlineLabel}
    </label>
  )

  return (
    <div className={cn(containerClassName)}>
      {!label ? (
        <div className="flex">
          {getInput()}
          {getInlineLabel()}
        </div>
      ) : (
        <LabelWrapper
          type={props.type}
          label={label}
          required={props.required}
          name={props.name}
        >
          {getInput()}
          {inlineLabel && getInlineLabel()}
        </LabelWrapper>
      )}
    </div>
  )
}

type TextareaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  'onChange'
> & {
  label?: string
  onChange?: (value: string) => void
  containerClassName?: string
}
export const Textarea: React.FC<TextareaProps> = ({
  label,
  onChange,
  className = '',
  containerClassName = '',
  rows = 4,
  ...props
}) => {
  const onChangeHandler = React.useCallback(
    (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!onChange) return
      onChange(ev.target.value)
    },
    [onChange]
  )
  const textareaElement = (
    <textarea
      className={cn(COMMON_INPUT_STYLE, 'rounded-sm', className)}
      rows={rows}
      onChange={onChangeHandler}
      {...props}
    />
  )
  return (
    <div className={cn(containerClassName)}>
      {label ? (
        <LabelWrapper
          type="textarea"
          label={label}
          required={props.required}
          name={props.name}
        >
          {textareaElement}
        </LabelWrapper>
      ) : (
        textareaElement
      )}
    </div>
  )
}

type RadioGroupProps = {
  onChange?: (value: string) => void
  label?: string
  name: string
  value: string | null
  required?: boolean
  options: Array<{
    value: string
    label: string | React.ReactNode
  }>
  containerClassName?: string
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  onChange,
  name,
  value,
  options,
  label,
  required = false,
  containerClassName = '',
}) => {
  const onChangeHandler = React.useCallback(
    (elementValue: string) => () => {
      if (!onChange) return
      onChange(elementValue)
    },
    [onChange]
  )
  const getOptions = () =>
    options.map((option, i) => (
      <Input
        key={option.value}
        type="radio"
        name={name}
        value={option.value}
        checked={option.value === value}
        inlineLabel={option.label}
        required={required}
        onChange={onChangeHandler(option.value)}
      />
    ))
  return (
    <div className={containerClassName}>
      {label ? (
        <LabelWrapper label={label} required={required} name={name}>
          <div>{getOptions()}</div>
        </LabelWrapper>
      ) : (
        <div>{getOptions()}</div>
      )}
    </div>
  )
}

type CheckboxGroupProps = {
  onChange?: (value: string[]) => void
  label?: string
  name: string
  value: string[]
  required?: boolean
  options: Array<{
    value: string
    label: string | React.ReactNode
  }>
  className?: string
}
export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  onChange,
  name,
  value = [],
  options,
  label,
  required = false,
  className,
}) => {
  const onChangeHandler = React.useCallback(
    (elementValue: string) => () => {
      if (!onChange) return
      onChange(toggleInArray(value, elementValue))
    },
    [onChange, value]
  )
  const getOptions = () =>
    options.map((option, i) => (
      <Input
        key={option.value}
        type="checkbox"
        name={name}
        value={option.value}
        checked={value.includes(option.value)}
        inlineLabel={option.label}
        onChange={onChangeHandler(option.value)}
        required={required}
      />
    ))
  return (
    <div className={cn(className)}>
      {label ? (
        <LabelWrapper label={label} name={name} required={required}>
          <div>{getOptions()} </div>
        </LabelWrapper>
      ) : (
        getOptions()
      )}
    </div>
  )
}

type SelectProps = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  'onChange'
> & {
  label?: string
  options: Array<{
    label: string
    value: string
    disabled?: boolean
  }>
  placeholder?: string
  onChange?: (value: string) => void
  containerClassName?: string
}
export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  label,
  containerClassName,
  ...props
}) => {
  const onChangeHandler = React.useCallback(
    (ev: React.ChangeEvent<HTMLSelectElement>) => {
      if (!onChange) return
      onChange(ev.target.value)
    },
    [onChange, value]
  )
  let placeholderValue = placeholder ?? 'Select a value'
  const getSelect = () => (
    <select
      {...props}
      value={value || 'defaultValue'}
      onChange={onChangeHandler}
      className={cn(
        COMMON_INPUT_STYLE,
        'rounded-md py-3 pr-9 pl-4',
        props.className,
        !value && 'text-text-disabled'
      )}
    >
      <option value={'defaultValue'} disabled className="text-text-disabled">
        {placeholderValue}
      </option>
      {options.map((x) => (
        <option key={x.value} value={x.value} disabled={x.disabled || false}>
          {x.label}
        </option>
      ))}
    </select>
  )
  return (
    <div className={cn(containerClassName)}>
      {label ? (
        <LabelWrapper
          label={label}
          required={props.required}
          name={props.name}
          type={'select'}
        >
          {getSelect()}
        </LabelWrapper>
      ) : (
        getSelect()
      )}
    </div>
  )
}

export type TypeaheadInputOption = { id: string; label: string }
export type TypeaheadInputProps = {
  maxSelected: number
  showCounter?: boolean
  // allowToCreateNew: boolean
  onChangeQuery: (value: string) => void
  initialQuery?: string
  suggestedOptions: TypeaheadInputOption[]
  onChange: (value: TypeaheadInputOption[]) => void
  value: TypeaheadInputOption[]
  debounceDelay: number
  containerClassName?: string
  className?: string
  label?: string
  required?: boolean
  placeholder?: string
  preventOptionsColoring?: boolean
  onKeyDown?: (ev: React.KeyboardEvent<HTMLInputElement>) => void
  onKeyUp?: (ev: React.KeyboardEvent<HTMLInputElement>) => void
  useFocusInputHotkey?: boolean
  disabled?: boolean
}
export const TypeaheadInput: React.FC<TypeaheadInputProps> = ({
  containerClassName,
  label,
  onChange,
  value = [],
  maxSelected,
  preventOptionsColoring = false,
  ...props
}) => {
  const inputRef = React.useRef() as React.MutableRefObject<HTMLInputElement>
  const [pristine, setPristine] = React.useState<boolean>(true)
  const [query, setQuery] = React.useState<string>(props.initialQuery || '')
  const debouncedQuery = props.debounceDelay
    ? useDebounce(query, props.debounceDelay)
    : query
  const [deletionСandidate, setDeletionСandidate] = React.useState<
    string | null
  >(null)
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] =
    React.useState<number>(-1)
  const suggestionsNumber = React.useMemo(
    () => (props.suggestedOptions || []).length,
    [props.suggestedOptions]
  )

  React.useEffect(() => {
    if (props.initialQuery) {
      setQuery(props.initialQuery)
    }
  }, [props.initialQuery])
  React.useEffect(
    () => props.onChangeQuery(debouncedQuery),
    [debouncedQuery, props.onChangeQuery]
  )
  React.useEffect(() => {
    if (!query) {
      setPristine(true)
    }
  }, [query])
  React.useEffect(() => {
    if (!suggestionsNumber) {
      setFocusedSuggestionIndex(-1)
    }
  }, [suggestionsNumber])
  React.useEffect(() => {
    if (value.length >= maxSelected) {
      setTimeout(() => inputRef?.current?.blur(), 100)
    }
  }, [value, maxSelected, inputRef])

  const onMainAreaClick = React.useCallback(
    () => inputRef?.current?.focus(),
    [inputRef]
  )
  if (props.useFocusInputHotkey) {
    useFocusInputHotkey(onMainAreaClick)
  }
  const selectOption = React.useCallback(
    (option: TypeaheadInputOption) => {
      onChange([...value, option])
      setQuery('')
      setTimeout(() => inputRef?.current?.focus(), 100)
    },
    [onChange, value]
  )
  const onSelectOption = React.useCallback(
    (option: TypeaheadInputOption) => (ev: React.MouseEvent) => {
      ev.preventDefault()
      selectOption(option)
    },
    [selectOption]
  )
  const selectOptionByIndex = React.useCallback(
    (index: number) => {
      const option = props.suggestedOptions[index]
      if (option) {
        selectOption(option)
      }
    },
    [props.suggestedOptions, selectOption]
  )
  const onKeyDown = React.useCallback(
    (ev: React.KeyboardEvent<HTMLInputElement>) => {
      const key = ev.key
      if (key === 'Backspace' && !query) {
        if (value.length) {
          if (!deletionСandidate) {
            const lastOption = value[value.length - 1]
            setDeletionСandidate(lastOption.id)
          } else {
            onChange(value.filter((x) => x.id !== deletionСandidate))
            setDeletionСandidate(null)
          }
        }
      }
      if (key === 'Escape') {
        if (!query && deletionСandidate) {
          setDeletionСandidate(null)
        }
        if (query) {
          setQuery('')
        }
        setFocusedSuggestionIndex(-1)
      }
      if (key === 'ArrowDown' || key === 'ArrowRight') {
        setFocusedSuggestionIndex((x) => {
          if (x >= suggestionsNumber - 1) {
            return 0
          }
          return x + 1
        })
      }
      if (key === 'ArrowUp' || key === 'ArrowLeft') {
        setFocusedSuggestionIndex((x) => {
          if (x <= 0) {
            return suggestionsNumber - 1
          }
          return x - 1
        })
      }
      if (key === 'Enter' && focusedSuggestionIndex !== -1) {
        setFocusedSuggestionIndex(-1)
        selectOptionByIndex(focusedSuggestionIndex)
        ev.preventDefault()
        return
      }
      if (value.length >= maxSelected) {
        ev.preventDefault()
      }
      if (props.onKeyDown) {
        props.onKeyDown(ev)
      }
    },
    [
      query,
      deletionСandidate,
      value,
      focusedSuggestionIndex,
      setFocusedSuggestionIndex,
      maxSelected,
      props.onKeyDown,
    ]
  )
  const onKeyUp = React.useCallback(
    (ev: React.KeyboardEvent<HTMLInputElement>) => {
      if (props.onKeyUp) {
        props.onKeyUp(ev)
      }
    },
    [props.onKeyUp]
  )
  const onChangeQueryInternal = React.useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(ev.target.value), setPristine(false)
      if (deletionСandidate) {
        setDeletionСandidate(null)
      }
    },
    [deletionСandidate]
  )
  const getInput = () => (
    <div
      className={cn(
        COMMON_INPUT_STYLE,
        'flex flex-wrap px-2 py-3 items-start justify-start gap-1'
      )}
      onClick={onMainAreaClick}
    >
      {value.map((x, i) => (
        <div
          key={x.id}
          className={cn(
            'flex items-center px-2 rounded-md',
            !preventOptionsColoring && 'bg-purple-50 text-purple-400',
            i !== value.length - 1 && 'mr-1',
            x.id === deletionСandidate && 'opacity-50'
          )}
        >
          {x.label}
        </div>
      ))}
      <input
        ref={inputRef}
        className={cn(
          'flex-1 min-w-[100px] mb-0 px-3 focus:outline-none rounded-lg bg-transparent placeholder-text-disabled',
          props.className
        )}
        value={query}
        onChange={onChangeQueryInternal}
        placeholder={props.placeholder || ''}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        disabled={props.disabled}
      />
    </div>
  )
  const getSuggestions = () =>
    !!props.suggestedOptions.length &&
    !pristine && (
      <div className={'absolute bottom-0 right-0 left-0'}>
        <div className="absolute flex flex-wrap w-full mt-2 px-2 bg-white rounded-b-sm">
          {props.suggestedOptions.map((x, i) => (
            <Button
              tabIndex={-1}
              key={x.id}
              size="small"
              kind={i === focusedSuggestionIndex ? 'primary' : 'secondary'}
              className="mr-2 mb-2 rounded-md"
              onClick={onSelectOption(x)}
            >
              {x.label}
            </Button>
          ))}
        </div>
      </div>
    )

  return (
    <div className={cn('relative', containerClassName)}>
      {label ? (
        <LabelWrapper
          label={label}
          type={'typeaheadInput'}
          required={props.required}
          extraLabel={
            props.showCounter && maxSelected
              ? `${value.length} / ${maxSelected}`
              : null
          }
        >
          <div className={cn('flex relative', props.className)}>
            {getInput()}
            {getSuggestions()}
          </div>
        </LabelWrapper>
      ) : (
        <>
          {getInput()}
          {getSuggestions()}
        </>
      )}
    </div>
  )
}
