import React from 'react'
import { cn } from '#client/utils'
import { H1 } from './Text'

export const PanelWrapper: React.FC<{
  children: React.ReactNode
}> = ({ children }) => (
  <div className="grid grid-cols-1 grid-rows-[auto_1fr] gap-y-4 h-full overflow-auto">
    {children}
  </div>
)

export const TopBanner: React.FC<{
  title: string | null
  color?: string
  textColor?: string
}> = ({ title, color = 'bg-white', textColor = 'text-text-tertiary' }) => (
  <div
    className={cn(
      'w-full h-16 rounded-sm flex items-center justify-center',
      color
    )}
  >
    {title && <H1 className={cn('text-[24px] m-0', textColor)}>{title}</H1>}
  </div>
)

export const Island: React.FC<{
  mainAreaColor?: string
  className?: string
  children: React.ReactNode
}> = ({ mainAreaColor = 'bg-fill-6', className, children }) => (
  <div
    className={cn(
      'rounded-sm px-8 py-6 bg-white flex flex-col overflow-scroll',
      className
    )}
  >
    <div
      className={cn(
        'w-full p-2 px-6 rounded-[10px] overflow-auto flex-grow',
        mainAreaColor
      )}
    >
      {children}
    </div>
  </div>
)

export const Panel: React.FC<{
  title: string | null
  topBannerColor?: string
  topBannerTextColor?: string
  mainAreaColor?: string
  className?: string
  children: React.ReactNode
}> = ({
  title,
  topBannerColor = 'bg-white',
  topBannerTextColor = 'text-text-tertiary',
  mainAreaColor = 'bg-fill-6',
  className,
  children,
}) => {
  return (
    <PanelWrapper>
      <TopBanner
        color={topBannerColor}
        textColor={topBannerTextColor}
        title={title}
      />
      <Island mainAreaColor={mainAreaColor} className={className}>
        {children}
      </Island>
    </PanelWrapper>
  )
}
