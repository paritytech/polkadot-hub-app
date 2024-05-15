import { EntityVisibility } from '#shared/types'

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

export type PaymentItem = {
  id: string
  userId: string
  status: string
  provider: PaymentProvider
  reference: [any]
  purchasedProductReference: any
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
