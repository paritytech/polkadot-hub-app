import { useOnClickOutside } from '#client/utils/hooks'
import { cn } from '#client/utils/index'
import React, {
  ForwardedRef,
  ReactNode,
  RefObject,
  useEffect,
  useState,
} from 'react'
import { FButton, MoreButton, Size } from './Button'
import { Icons, Icon } from './Icons'
import { P } from './Text'

type DropDownProps = {
  onClose: () => void
  theme?: string
  open?: boolean
  title?: string
  rows: ReactNode[]
  className?: string
  closeButton?: boolean
  ref: ForwardedRef<HTMLElement>
}

export const DropDown = React.forwardRef<HTMLInputElement, DropDownProps>(
  ({ onClose, title, rows, open, closeButton = false, className }, ref) => {
    const [menuOpen, setMenuOpen] = useState(open)
    const main =
      'absolute flex flex-col bg-white px-2 py-3 sm:gap-1 shadow-custom rounded-sm z-20'
    const desktop =
      'sm:w-[200px] sm:absolute sm:mt-12 sm:left-auto sm:bottom-auto'
    const mobile = 'fixed bottom-2 left-2 right-2 px-3 gap-4'

    const closeMenu = () => {
      setMenuOpen(false)
      onClose()
      document.body.classList.remove(`overflow-hidden`, `sm:overflow-auto`)
    }

    useOnClickOutside(ref as RefObject<HTMLElement>, () => closeMenu())

    useEffect(() => {
      if (menuOpen) {
        document.body.classList.add(`overflow-hidden`, `sm:overflow-auto`)
      }
    }, [])

    return (
      <>
        <div className={cn(main, desktop, mobile, className)}>
          {title && (
            <P className="text-text-tertiary mb-0 mt-0 px-1 py-1">{title}</P>
          )}
          {rows}
          {closeButton && (
            <Row
              className="hidden sm:flex sm:flex-row"
              label="Close"
              icon="Cross"
              onClick={closeMenu}
            />
          )}
          <hr className="sm:hidden"></hr>
          <FButton
            className="z-20 text-center sm:hidden text-text-tertiary font-semibold"
            kind="link"
            onClick={closeMenu}
          >
            Close
          </FButton>
        </div>
        <div className="z-10 fixed left-0 top-0 bottom-0 right-0 bg-applied-overlay opacity-70 overscroll-x-none overflow-y-hidden overflow-x-none sm:hidden" />
      </>
    )
  }
)

type MenuItem = {
  name: string
  link?: string
  icon?: string
  action?: () => void
}

const Row: React.FC<{
  label: string
  icon: string
  onClick: () => void
  className?: string
}> = ({ label, icon, onClick, className }) => {
  const Component = Icons[icon as Icon]
  return (
    <FButton
      kind="link"
      className={cn(
        'flex gap-3 items-center h-8 px-3 cursor-pointer hover:bg-applied-hover rounded-tiny',
        className
      )}
      onClick={() => onClick()}
    >
      {!!icon && <Component />}
      <P className="text-text-secondary font-semibold font-inter w-32 text-left">
        {label}
      </P>
    </FButton>
  )
}

export const DropDownMenu: React.FC<{
  items: Array<MenuItem>
  closeButton?: boolean
  buttonSize?: Size
  containerClassName?: string
}> = ({
  items,
  closeButton = false,
  buttonSize = Size.Big,
  containerClassName = '',
}) => {
  const [open, setOpen] = useState(false)
  const ref = React.useRef(null)
  const rows = items.map((item) => (
    <Row
      key={item.name}
      label={item.name}
      icon={item.icon || ''}
      onClick={() => {
        setOpen(false)
        if (item.action) {
          item.action()
        } else if (item.link) {
          const url = new URL(window.location.href)
          url.pathname = item.link
          window.location.href = url.toString()
        }
      }}
    />
  ))
  return (
    <div
      ref={ref}
      className={cn(
        'flex justify-start items-end flex-col relative',
        containerClassName
      )}
    >
      {/* TODO: dont use enums for props? */}
      <MoreButton onClick={() => setOpen(!open)} size={buttonSize} />
      {open ? (
        <DropDown
          ref={ref}
          rows={rows}
          onClose={() => setOpen(false)}
          open={open}
          closeButton={closeButton}
        />
      ) : null}
    </div>
  )
}
