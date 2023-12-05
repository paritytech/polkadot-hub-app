import React, { useCallback, useState } from 'react'
import { cn } from '#client/utils'
import { renderMarkdown } from '#client/utils/markdown'
// import { Textarea } from './Input'

type Props = React.HTMLAttributes<HTMLTextAreaElement> & {
  onChange?: (ev: React.ChangeEvent<HTMLTextAreaElement>) => void
  onChangeValue?: (value: string) => void
  name?: string
  label?: string
  required?: boolean
}
type ButtonProps = React.HTMLAttributes<HTMLButtonElement> & {
  active?: boolean
}

type State = 'editor' | 'split' | 'preview'

const Button: React.FC<ButtonProps> = ({
  onClick,
  children,
  className,
  active = false,
}) => (
  <button
    tabIndex={-1}
    onClick={onClick}
    className={cn(
      'border rounded border-gray-300 text-gray-500 py-0.5 px-1 text-xs focus:border-purple-400 focus:ring focus:ring-purple-100 focus:outline-none',
      active ? 'bg-gray-100' : 'bg-white',
      className
    )}
  >
    {children}
  </button>
)

export const MarkdownTextarea: React.FC<Props> = ({
  className,
  defaultValue,
  label,
  required = false,
  onChange,
  onChangeValue,
  ...rest
}) => {
  const [state, setState] = useState('editor' as State)
  const onChangeState = useCallback(
    (state: State) => (ev: React.MouseEvent<HTMLElement>) => {
      ev.preventDefault()
      setState((currentState: State) => {
        if (state !== 'editor' && state === currentState) {
          return 'editor'
        }
        return state
      })
    },
    []
  )
  const handleChange = useCallback(
    (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (onChange) {
        onChange(ev)
      }
      if (onChangeValue) {
        onChangeValue(ev.target.value)
      }
    },
    [onChangeValue, onChange]
  )
  return (
    <div>
      {!!label && (
        <div className="text-gray-500 text-sm pl-1 mb-1 h-5">
          {label}
          {required ? <span className="text-red-400 ml-0.5">*</span> : null}
        </div>
      )}
      <div
        style={{ minHeight: '8em' }}
        className={cn(
          'flex relative rounded border border-gray-300 overflow-hidden md-textarea',
          className
        )}
      >
        {['editor', 'split'].includes(state) && (
          <textarea
            style={{ minHeight: '9em' }}
            className={cn(
              'bg-white min-h-full font-mono border-0 outline-none focus:ring-0 py-2 px-5',
              state === 'split' ? 'w-1/2' : 'w-full'
            )}
            defaultValue={defaultValue}
            placeholder="Markdown content"
            onChange={handleChange}
            {...rest}
          />
        )}
        {['preview', 'split'].includes(state) && (
          <div
            style={{ minHeight: '8em' }}
            className={cn(
              'bg-white min-h-8 overflow-y-scroll __px-2__py-1 py-2 px-5',
              state === 'split' ? 'w-1/2 border-l border-gray-300' : 'w-full'
            )}
            dangerouslySetInnerHTML={{
              __html: defaultValue
                ? renderMarkdown(String(defaultValue))
                : `<span class='text-gray-300'>Nothing to preview</span>`,
            }}
          />
        )}
        <div className="absolute top-1 right-1 flex">
          <Button
            active={state === 'editor'}
            onClick={onChangeState('editor')}
            className="mr-1"
          >
            Write
          </Button>
          <Button
            active={state === 'split'}
            onClick={onChangeState('split')}
            className="mr-1"
          >
            Split
          </Button>
          <Button
            active={state === 'preview'}
            onClick={onChangeState('preview')}
          >
            Preview
          </Button>
        </div>
      </div>
    </div>
  )
}
