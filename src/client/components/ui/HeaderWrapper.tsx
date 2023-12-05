import { cn } from '#client/utils'
import { BackButton } from './Button'
import { H1, H2, P } from './Text'

export const HeaderWrapper: React.FC<{
  children: React.ReactNode
  title?: string
  secondTitle?: string
  subtitle?: string | Array<React.ReactNode>
  backButton?: boolean
}> = ({ title, secondTitle, children, subtitle, backButton = true }) => (
  <div>
    {backButton && <BackButton />}
    {title && (
      <H1 className={cn('text-center', !subtitle && 'mb-14')}>{title}</H1>
    )}
    {secondTitle && <H2 className="text-center">{secondTitle}</H2>}
    {subtitle && (
      <P
        textType="additional"
        className="text-center text-text-tertiary max-w-[600px] m-auto mb-10"
      >
        {subtitle}
      </P>
    )}
    {children}
  </div>
)
