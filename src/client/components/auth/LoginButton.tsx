import React, { useMemo } from 'react'
import { FButton } from '#client/components/ui'
import { cn } from '#client/utils'
import { LoginIcons, providerUrls } from './helper'

type Props = {
  label?: string
  className?: string
  size?: 'normal' | 'small'
  callbackPath?: string
  provider?: string
  icon?: string
  currentState?: string
}

export const LoginButton: React.FC<Props> = ({
  className = '',
  size = 'normal',
  label = 'Login with Google',
  provider = 'google',
  icon = 'google',
  currentState = 'Login',
  ...props
}) => {
  const loginUrl = useMemo(() => {
    if (!props.callbackPath) {
      return providerUrls[provider]
    }
    const url = new URL(providerUrls[provider])
    url.searchParams.append('callbackPath', props.callbackPath)
    return url.toString()
  }, [provider])

  return (
    <div>
      <FButton
        href={loginUrl}
        rel="external"
        kind="primary"
        size={size}
        className={cn(
          'inline-flex items-center',
          size === 'normal' && 'px-12',
          size === 'small' && 'px-8',
          className
        )}
      >
        {icon && <div className="mr-4">{LoginIcons[icon]}</div>}
        <span>{label}</span>
      </FButton>
    </div>
  )
}
