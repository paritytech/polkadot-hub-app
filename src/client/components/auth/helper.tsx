import config from '#client/config'
import { cn } from '#client/utils'
import { Background, H1, Icons, Link, P } from '../ui'

export const LoginIcons: Record<string, JSX.Element> = {
  google: <Icons.Gmail />,
  polkadot: <Icons.Polkadot />,
}

export const providerUrls: Record<string, string> = {
  google: `${config.appHost}/auth/google/login`,
  polkadot: `${config.appHost}/polkadot`,
}

export const Errors = {
  NoExtensionError: 'No extension is enabled',
  NoAccountsError: 'No accounts added',
}

export const ErrorComponent = {
  [Errors.NoAccountsError]: () => (
    <>
      <P className="text-accents-red">Error: No accounts found.</P>
      <P>Please add at least one account to polkadot-js extension.</P>
      <Link
        target="_blank"
        className="text-text-secondary"
        href="https://polkadot.js.org/extension/"
      >
        Reference here
      </Link>
    </>
  ),
  [Errors.NoExtensionError]: () => (
    <>
      <P className="text-accents-red">Error: No extension is enabled</P>
      <Link
        target="_blank"
        className="text-text-secondary"
        href="https://polkadot.js.org/extension/"
      >
        Download polkadot-js browser extension
      </Link>
    </>
  ),
}

export const WhiteWindow: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <Background color="#101015" className="relative">
      <div className="mx-auto px-2 max-w-[870px] flex flex-col justify-center h-full">
        <div
          className={cn(
            'bg-bg-primary py-[96px] h-[540px] px-4 rounded-sm text-center'
          )}
        >
          {children}
        </div>
      </div>
    </Background>
  )
}

export const AuthSteps = {
  Connecting: 'Connecting',
  ChooseAccount: 'ChooseAccount',
  Warning: 'Warning',
  BasicSetting: 'BasicSetting',
  Redirect: 'Redirect',
}

export const GENERIC_ERROR = 'There has been an error. Please try again later'

export const StepWrapper: React.FC<{
  title: string
  subtitle?: string
  children: React.ReactNode
}> = ({ title, subtitle, children }) => (
  <div className="flex flex-col gap-4 justify-center items-center">
    <div>
      <H1 className={subtitle ? 'mb-2' : ''}>{title}</H1>
      {subtitle && (
        <P
          textType="additional"
          className="text-text-tertiary text-center max-w-[400px] mt-0"
        >
          {subtitle}
        </P>
      )}
    </div>
    {children}
  </div>
)
export const LoadingPolkadot = () => <Icons.Polkadot className="animate-spin" />
