import { EntityVisibility, User } from '#shared/types'

export enum PaymentProvider {
  Polkadot = 'polkadot',
  Stripe = 'stripe',
}

export type PaymentItemCreateFields = Pick<
  PaymentItem,
  | 'userId'
  | 'status'
  | 'currency'
  | 'amount'
  | 'reference'
  | 'purchasedProductReference'
  | 'providerReferenceId'
  | 'provider'
>

export type PaymentItemWithUser = PaymentItem & { User: User }
export type PaymentItem = {
  id: string
  userId: string
  status: string
  provider: PaymentProvider
  reference: [any]
  purchasedProductReference: {
    id: string
    name: string
    url: string
    amount: string
    duration: number
    type: 'day' | 'hour'
    currency: string
    location: string
    description: string
  }

  amount: number
  currency: string
  providerReferenceId: string
  // allowedRoles: string[]
  // visibility: EntityVisibility
  createdAt: Date
  updatedAt: Date
}

export enum PaymentStatus {
  Intent = 'intent',
  Success = 'success',
  Error = 'error',
}

export enum PaymentSteps {
  Connecting = 'Connecting',
  TransactionInProgress = 'TransactionInProgress',
  TransactionFinalized = 'TransactionFinalized',
  Error = 'Error',
}
