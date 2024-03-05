import { LoadingPolkadot } from './LoadingPolkadot'
import { H3 } from './Text'

export const LoadingPolkadotWithText = ({
  text = 'Connecting',
}: {
  text?: string
}) => (
  <div className="flex flex-col justify-center items-center">
    <H3>{text}</H3>
    <LoadingPolkadot />
  </div>
)
