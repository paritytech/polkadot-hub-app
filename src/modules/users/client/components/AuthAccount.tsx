import { FButton, P } from '#client/components/ui'
import React from 'react'

export const AuthAccount = ({
  icon,
  title,
  subtitle,
  connected,
  onConnect,
  children,
}: {
  icon: JSX.Element
  title: string
  subtitle: string
  connected: boolean
  onConnect: () => void
  children: React.ReactNode
}) => {
  return (
    <>
      <div className="grid grid-cols-6">
        <div className="flex flex-col sm:flex-row gap-4 col-span-5">
          <div className="h-8 w-8">{icon}</div>
          <div className="flex flex-col">
            <>
              <P
                textType="additional"
                className="font-bold text-text-secondary mb-0 mt-0"
              >
                {title}
              </P>
              <P textType="additional" className="mt-0 text-text-tertiary">
                {subtitle}
              </P>
            </>
            <div>{children}</div>
          </div>
        </div>
        <FButton
          size="small"
          kind={connected ? 'secondary' : 'primary'}
          className="hidden sm:block w-full h-[48px]"
          onClick={!connected ? () => onConnect() : () => {}}
          disabled={connected}
        >
          {connected ? 'Connected' : 'Connect'}
        </FButton>
      </div>
      <FButton
        size="small"
        kind={connected ? 'secondary' : 'primary'}
        className="visible sm:hidden w-full h-[48px] mt-2"
        onClick={!connected ? () => onConnect() : () => {}}
        disabled={connected}
      >
        {connected ? 'Connected' : 'Connect'}
      </FButton>
    </>
  )
}
