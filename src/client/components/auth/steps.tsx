import { useMemo, useState } from 'react'
import {
  CopyToClipboard,
  FButton,
  Icons,
  Input,
  LoadingPolkadot,
  LoadingPolkadotWithText,
  P,
  Select,
} from '../ui'
import { extensionConfig } from './config'
import {
  AuthSteps,
  ButtonWrapper,
  ExtensionAccount,
  StepWrapper,
  WalletTab,
  isWalletConnect,
} from './helper'
import { BaseWallet } from '@polkadot-onboard/core'

type ChooseWalletProps = {
  wallets: BaseWallet[]
  onClickConnect: (wallet: BaseWallet) => void
}

const ChooseWalletStep: React.FC<ChooseWalletProps> = ({
  wallets,
  onClickConnect,
}) => (
  <StepWrapper
    title="Choose Wallet"
    subtitle={
      <div className="hidden sm:block mb-4">
        {wallets.length === 1 && isWalletConnect(wallets[0]) && (
          <div>
            <div className="mb-2">Supported browser extensions</div>
            <div className="flex gap-2 justify-center">
              {extensionConfig.supported.map((extension) => (
                <a key={extension.id} href={extension.urls.main}>
                  <img
                    height="24"
                    width="24"
                    src={extension.image}
                    className="hover:scale-110"
                  ></img>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    }
  >
    <div className="flex flex-col gap-4">
      {wallets.map((wallet: BaseWallet) => {
        return (
          <WalletTab
            key={wallet.metadata.id}
            wallet={wallet}
            name={
              isWalletConnect(wallet) ? 'Wallet Connect' : wallet.metadata.title
            }
            id={wallet.metadata.id}
            onClickConnect={() => onClickConnect(wallet)}
          />
        )
      })}
    </div>
  </StepWrapper>
)

type ChooseAccountProps = {
  accounts: ExtensionAccount[]
  chosenWallet: BaseWallet
  onAddressSelect: (v: string) => void
  onWalletConnectClick: () => void
  onBack: () => void
  onContinue: () => void
}
const ChooseAccountStep: React.FC<ChooseAccountProps> = ({
  accounts,
  chosenWallet,
  onAddressSelect,
  onBack,
  onContinue,
  onWalletConnectClick,
}) => {
  const [selectedAddress, setSelectedAddress] = useState('')
  const selectedAccount = useMemo(
    () => accounts.find((a) => a.address === selectedAddress),
    [selectedAddress]
  )
  return (
    <StepWrapper title="Choose account">
      <div>
        <Select
          placeholder="select account"
          containerClassName="w-full mb-4"
          value={selectedAddress}
          onChange={(v) => {
            setSelectedAddress(v)
            onAddressSelect(v)
          }}
          options={accounts.map((account) => ({
            label: `${account.name} (${account.source})`,
            value: account.address,
          }))}
        ></Select>
        <div className="flex align-middle justify-center gap-2 mb-2">
          <Icons.WarningIcon />
          <P
            textType="additional"
            className="text-text-secondary mt-0 max-w-[400px] text-left"
          >
            We strongly recommend to use a separate empty account as identity
            instead of your wallet with real funds.
          </P>
        </div>
        <ButtonWrapper>
          <FButton
            className="w-full sm:w-fit h-14 sm:h-full"
            kind="secondary"
            size="small"
            onClick={onBack}
          >
            Back
          </FButton>
          <FButton
            className="w-full sm:w-fit h-14  sm:h-full"
            kind="primary"
            size="small"
            onClick={onContinue}
            disabled={!selectedAccount}
          >
            Continue
          </FButton>
        </ButtonWrapper>
      </div>

      {isWalletConnect(chosenWallet) && (
        <WalletTab
          className="w-fit mt-4 mx-auto border-0"
          key={chosenWallet.metadata.id}
          wallet={chosenWallet}
          name={'Wallet Connect'}
          id={chosenWallet.metadata.id}
          onClickConnect={onWalletConnectClick}
          disconnect={true}
        />
      )}
    </StepWrapper>
  )
}

type WarningStepProps = {
  selectedAddress: string
  onCreateNew: () => void
  onLink: () => void
}
const WarningStep: React.FC<WarningStepProps> = ({
  selectedAddress,
  onCreateNew,
  onLink,
}) => (
  <div className="flex flex-col gap-4">
    <StepWrapper title="New account">
      <div className="mb-6">
        <>
          <div className="flex items-center text-text-secondary justify-between opacity-50">
            <P>{`${selectedAddress.slice(0, 28)}...`} </P>
            <CopyToClipboard text={selectedAddress} />
          </div>
          <P className="mb-6 mt-0 text-left">
            {' '}
            This address is not linked to any account.
            <br />
            Do you want to create a new account?
          </P>
        </>
        <ButtonWrapper className="sm:flex-col">
          <FButton onClick={onCreateNew}>Yes, create a new account</FButton>
          <FButton kind="secondary" onClick={onLink}>
            No, link to my existing Google account.
          </FButton>
        </ButtonWrapper>
      </div>
    </StepWrapper>
    <FButton
      kind="link"
      href="/login"
      className="mt-4 w-fit m-auto text-text-secondary"
    >
      {' '}
      Go to Login
    </FButton>
  </div>
)

type ErrorStepProps = {
  error: string
  onTryAgain: () => void
}
const ErrorStep: React.FC<ErrorStepProps> = ({ error, onTryAgain }) => (
  <StepWrapper title="Error">
    {error}
    <FButton className="mt-10" onClick={onTryAgain}>
      Try again
    </FButton>
  </StepWrapper>
)

type BasicSettingStepProps = {
  onSubmit: (userDetails: { fullName: string; email: string }) => void
}

const BasicSettingStep: React.FC<BasicSettingStepProps> = ({ onSubmit }) => {
  const [userDetails, setUserDetails] = useState({
    fullName: '',
    email: '',
  })
  return (
    <StepWrapper
      title="Set Up Your Profile"
      subtitle={
        'Let us know a few details about you so we know how to properly address you, and how to contact you.'
      }
    >
      <form
        className="w-5/6 mt-4"
        onSubmit={(ev: React.FormEvent) => {
          ev.preventDefault()
          onSubmit(userDetails)
        }}
      >
        <Input
          name="fullName"
          type="text"
          placeholder="Your full name"
          value={userDetails.fullName || ''}
          onChange={(value) =>
            setUserDetails((x) => ({ ...x, fullName: String(value) }))
          }
          containerClassName="w-full"
          className="mb-2"
        />
        <Input
          name="email"
          type="email"
          placeholder="Your contact email"
          value={userDetails.email || ''}
          onChange={(value) =>
            setUserDetails((x) => ({ ...x, email: String(value) }))
          }
          containerClassName="w-full"
          className="mb-4"
        />
        <FButton className="mt-4" type="submit">
          Continue
        </FButton>
      </form>
    </StepWrapper>
  )
}

export const AuthStepsComponent: Record<
  string,
  JSX.Element | { (props?: any): JSX.Element }
> = {
  [AuthSteps.Connecting]: (
    <StepWrapper>
      <LoadingPolkadotWithText />
    </StepWrapper>
  ),
  [AuthSteps.ChooseWallet]: (props: ChooseWalletProps) => (
    <ChooseWalletStep {...props} />
  ),
  [AuthSteps.ChooseAccount]: (props: ChooseAccountProps) => (
    <ChooseAccountStep {...props} />
  ),
  [AuthSteps.Warning]: (props: WarningStepProps) => <WarningStep {...props} />,
  [AuthSteps.Redirect]: (
    <div className="flex justify-center items-center">
      <LoadingPolkadot />
    </div>
  ),
  [AuthSteps.Error]: (props: ErrorStepProps) => <ErrorStep {...props} />,
  [AuthSteps.BasicSetting]: (props: BasicSettingStepProps) => (
    <BasicSettingStep {...props} />
  ),
}
