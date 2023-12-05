import * as React from 'react'
import { createPortal } from 'react-dom'
import { useLockScroll } from '#client/utils/hooks'
import { cn } from '#client/utils'
import { H2 } from './Text'
import { RoundButton } from './Button'
import { Icons } from './Icons'

type ModalProps = {
  title?: string
  children: React.ReactNode
  onClose?: () => void
  size?: 'small' | 'normal' | 'wide'
}

export const ModalWrapper: React.FC<ModalProps> = ({
  title,
  children,
  onClose,
  size = 'small',
}) => {
  useLockScroll()
  return (
    <div className="fixed inset-0 z-30">
      <div
        className="bg-black bg-opacity-30 fixed inset-0 backdrop-blur"
        onClick={onClose}
      />
      <div
        className={cn(
          'mx-auto h-full relative z-10',
          'pb-2 pt-8 px-2 sm:p-4',
          'flex flex-col items-center justify-end sm:justify-center',
          size === 'small' && 'max-w-[540px]',
          size === 'normal' && 'max-w-[840px]',
          size === 'wide' && 'max-w-[1320px]'
        )}
        onClick={onClose}
      >
        <div
          className={cn(
            'max-h-full w-full',
            'rounded-sm shadow-md bg-white overflow-hidden',
            'flex flex-col',
            'py-6 sm:py-8'
          )}
          onClick={(ev: React.MouseEvent) => ev.stopPropagation()}
        >
          <div
            className={cn(
              'flex items-center justify-end px-6 sm:px-8',
              !!(title || onClose) && 'mb-6'
            )}
          >
            {!!title && <H2 className="flex-1 mb-0">{title}</H2>}
            {!!onClose && (
              <RoundButton
                onClick={onClose}
                icon="Cross"
                className="h-8 w-8 px-0"
              />
            )}
          </div>
          <div className="flex-1 overflow-y-scroll px-6 sm:px-8 -mb-6 sm:-mb-8 pb-6 sm:pb-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export const Modal: React.FC<ModalProps> = ({ children, ...props }) =>
  createPortal(
    <ModalWrapper {...props}>{children}</ModalWrapper>,
    document.body
  )
