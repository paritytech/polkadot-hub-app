import { cn } from '#client/utils'
import React from 'react'
import { Icons, Icon } from './Icons'

type ButtonSize = 'small' | 'normal'
type ButtonColor = 'green' | 'red' | 'blue' | 'default' | 'purple' | 'black'
type ButtonKind = 'primary' | 'secondary' | 'link'

type CommonProps = {
  size?: ButtonSize
  color?: ButtonColor
  kind?: ButtonKind
}
type AProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & CommonProps
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & CommonProps

type Props = AProps | ButtonProps

const isButton = (props: Props): props is ButtonProps =>
  props.type === 'submit' || props.onClick !== undefined

const SIZE_CLASSNAME: Record<ButtonSize, string> = {
  small: 'py-0 px-2',
  normal: 'py-2 px-5',
}
const SECONDARY_COLOR_CLASSNAME: Record<ButtonColor, string> = {
  black: 'bg-white text-black border-black hover:bg-gray-50',
  green: 'bg-white text-green-600 border-green-300 hover:bg-green-50',
  red: 'bg-white text-red-600 border-red-300 hover:bg-red-50',
  blue: 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50',
  purple: 'bg-white text-purple-400 border-purple-300 hover:bg-purple-50',
  default: 'bg-white text-black border-gray-300 hover:bg-gray-50',
}
const PRIMARY_COLOR_CLASSNAME: Record<ButtonColor, string> = {
  black: 'bg-black text-white border-transparent hover:opacity-80',
  green: 'bg-green-500 text-white border-transparent hover:bg-green-600',
  red: 'bg-red-500 text-white border-transparent hover:bg-red-600',
  blue: 'bg-blue-500 text-white border-transparent hover:bg-blue-600',
  purple: 'bg-purple-400 text-white border-transparent hover:bg-purple-500',
  default: 'bg-gray-900 text-white border-transparent hover:bg-gray-800',
}

export const Button: React.FC<Props> = (props) => {
  const { size = 'normal', kind = 'secondary', color = 'default' } = props
  const className = cn(
    'inline-block rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-center border focus:ring focus:ring-purple-100 focus:outline-none',
    SIZE_CLASSNAME[size],
    kind === 'secondary'
      ? SECONDARY_COLOR_CLASSNAME[color]
      : PRIMARY_COLOR_CLASSNAME[color],
    props.className
  )

  if (isButton(props)) return <button {...props} className={className} />

  return (
    <a
      {...props}
      className={className}
      rel={props.rel || (props.target === '_blank' ? 'noreferrer' : undefined)}
    />
  )
}

export const FButton: React.FC<Props> = (props) => {
  const { kind = 'primary', size = 'normal' } = props
  const commonStyle = 'cursor-pointer disabled:cursor-not-allowed text-center'

  let buttonStyle = 'inline-block rounded rounded-lg font-semibold text-sm'
  let linkStyle =
    'text-accents-pink hover:bg-applied-hover p-2 text-center w-auto rounded-tiny disabled:bg-none disabled:text-accents-disabled disabled:bg-transparent'

  switch (kind) {
    case 'secondary': {
      buttonStyle = cn(
        buttonStyle,
        'bg-fill-6 text-text-tertiary hover:bg-applied-hover disabled:text-text-disabled disabled:bg-fill-6 disabled:hover:bg-fill-6'
      )
      break
    }
    case 'link': {
      buttonStyle = linkStyle
      break
    }
    default:
      buttonStyle = cn(
        buttonStyle,
        'bg-accents-pink text-white hover:bg-accents-pinkDark disabled:bg-accents-pinkLight'
      )
      break
  }
  if (kind == 'link') {
    buttonStyle = cn(buttonStyle, 'p-2')
  } else {
    switch (size) {
      case 'small': {
        buttonStyle = cn(buttonStyle, 'px-4 py-[10px]')
        break
      }
      default: {
        buttonStyle = cn(buttonStyle, 'px-8 py-[18px]')
      }
    }
  }

  const className = cn(buttonStyle, commonStyle, props.className)

  if (isButton(props)) return <button {...props} className={className} />

  return (
    <a
      {...props}
      className={className}
      rel={props.rel || (props.target === '_blank' ? 'noreferrer' : undefined)}
    />
  )
}

type SwitchButtonProps = {
  switchId: string
  label?: string
  checked: boolean
  onChange: (value: boolean) => void
}

export const SwitchButton: React.FC<SwitchButtonProps> = ({
  switchId,
  label = null,
  checked,
  onChange,
}) => {
  const _onChange = React.useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      return onChange(ev.target.checked)
    },
    [onChange]
  )
  return (
    <span className="switch">
      <input
        type="checkbox"
        id={switchId}
        checked={checked}
        onChange={_onChange}
      />
      <label htmlFor={switchId}>{label}</label>
    </span>
  )
}

export const RoundButton = ({
  onClick,
  icon,
  className,
  disabled = false,
  size = 'small',
}: {
  onClick: (ev: React.MouseEvent) => void
  icon: Icon
  className?: string
  disabled?: boolean
  size?: ButtonSize
}) => {
  let IconComponent = Icons[icon]
  if (!IconComponent) {
    console.warn(`Missing icon "${icon}". Can't render RoundButton component.`)
    IconComponent = () => <></>
  }
  return (
    <Button
      size={size}
      kind="secondary"
      onClick={onClick}
      className={cn(
        'rounded-full flex justify-center items-center',
        size === 'small' && ' h-9 w-9',
        size === 'normal' && ' h-14 w-14',
        className
      )}
      disabled={disabled}
    >
      <IconComponent />
    </Button>
  )
}

// @todo merge this Size with the ButtonSize above
export enum Size {
  Small = 'small',
  Big = 'big',
}

type MoreButtonProps = {
  size?: Size
  onClick: () => void
}

export const MoreButton: React.FC<MoreButtonProps> = ({
  size = Size.Small,
  onClick,
}) => {
  let style =
    'rounded-full hover:cursor-pointer flex justify-center items-center gap-1'

  switch (size) {
    case Size.Big:
      style = cn(style, 'h-12 w-12 bg-fill-6 hover:bg-fill-12')
      break
    default:
      style = cn(style, 'h-10 w-10 hover:bg-fill-6')
      break
  }
  return (
    <div className={style} onClick={onClick}>
      <div className="w-1 h-1 rounded-full bg-text-disabled"></div>
      <div className="w-1 h-1 rounded-full bg-text-disabled"></div>
      <div className="w-1 h-1 rounded-full bg-text-disabled"></div>
    </div>
  )
}

export const BackButton: React.FC<{
  className?: string
  onClick?: () => void
  text?: string
}> = ({ className, onClick, text = 'Back' }) => (
  <FButton
    kind="link"
    onClick={() => (!!onClick ? onClick() : window.history.back())}
    className={cn('mb-4 ml-[-8px] text-text-tertiary', className)}
  >
    {text}
  </FButton>
)
