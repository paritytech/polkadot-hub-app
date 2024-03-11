export type GuestInviteRequest = {
  fullName: string
  email: string
}

export type GuestInviteStatus =
  | 'pending'
  | 'opened'
  | 'confirmed'
  | 'rejected'
  | 'cancelled'

export type GuestInvite = {
  id: string
  creatorUserId: string
  code: string
  fullName: string
  email: string
  dates: string[]
  office: string
  areaId: string | null
  deskId: string | null
  status: GuestInviteStatus
  createdAt: Date
  updatedAt: Date
}

export type PublicGuestInvite = Pick<
  GuestInvite,
  'code' | 'fullName' | 'office'
>

export type GuestInviteGuestRequest = Pick<
  GuestInvite,
  'fullName' | 'dates'
> & { rules: string[] }

export type GuestInviteOfficeRule = { id: string; label: string }

export type GuestInviteUpdateRequest = Partial<
  Pick<GuestInvite, 'status' | 'areaId' | 'deskId'>
>

export type GuestInvitesAdminDashboardStats = {
  guestsTotal: number
  guestsToday: number
  topGuests: {
    userId: string
    fullName: string
    avatar: string | null
    visits: number
  }[]
  topInviters: {
    userId: string
    fullName: string
    avatar: string | null
    guests: number
  }[]
  guestsByDate: {
    date: string
    total: number
  }[]
}
