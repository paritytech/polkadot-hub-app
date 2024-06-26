export {}

export type Membership = {
  id: string
  createdAt: Date
  updatedAt: Date
  creatorUserId: string
  editedByUserId: string
  title: string
  description: string
  price: string
  currency: string
  nftCollectionId: string
  image: string
  offices: string[]
  durationInDays: number
}

export type MembershipCreationRequest = Omit<
  Membership,
  'id' | 'createdAt' | 'updatedAt' | 'creatorUserId' | 'editedByUserId'
>
