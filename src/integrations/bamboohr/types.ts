export type Employee = {
  id: string
  displayName: string
  firstName: string
  lastName: string
  preferredName: string | null
  jobTitle: string
  workPhone: string | null
  workEmail: string
  department: string
  location: string
  division: string
  pronouns: string | null
  supervisor: string
  photoUploaded: boolean
  photoUrl: string
  canUploadPhoto: number
  customRiotID: string
}

export type EmployeeWithExtraFields = Pick<
  Employee,
  'id' | 'workEmail' | 'firstName' | 'lastName'
> & { [key: string]: any }

export type EmployeeTimeOffRequest = {
  id: string
  employeeId: string
  status: {
    status: 'approved' | 'denied' | 'superseded' | 'requested' | 'canceled'
  }
  name: string
  start: string // YYYY-MM-DD
  end: string
  created: string
  type: { id: string; name: string }
  amount: { unit: 'days' | 'hours'; amount: '6' }
  dates: Record<string, string> // { 'YYYY-MM-DD': '0' | '1' | '4' | ... }
}
