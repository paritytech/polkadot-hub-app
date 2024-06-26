import React from 'react'
import {
  H1,
  Input,
  LabelWrapper,
  Link,
  Placeholder,
  Table,
  Tag,
  UserLabel,
  WidgetWrapper,
} from '#client/components/ui'
import { PermissionsValidator } from '#client/components/PermissionsValidator'
import { useUsersCompact } from '#modules/users/client/queries'
import { by, prop } from '#shared/utils/fp'
import { useDebounce, useDocumentTitle } from '#client/utils/hooks'
import Permissions from '#shared/permissions'
import { useGetPayments } from '../queries'
import { hasMembershipExpired } from '../helper'
import dayjs from 'dayjs'
import { FRIENDLY_DATE_FORMAT } from '#client/constants'
import { User } from '#shared/types'

function matchSearch(user: User, query: string): boolean {
  const trimmedQuery = query.trim()
  if (!trimmedQuery) return true
  if (user.email.includes(trimmedQuery)) {
    return true
  }
  if (user.fullName.includes(trimmedQuery)) {
    return true
  }
  return false
}

export const AdminPayments = () => (
  <PermissionsValidator
    required={[Permissions.news.__Admin, Permissions.news.AdminList]}
    onRejectGoHome
  >
    <_AdminPayments />
  </PermissionsValidator>
)

export const _AdminPayments = () => {
  useDocumentTitle('Payments')

  const [searchQuery, setSearchQuery] = React.useState<string>('')
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const { data: payments, isFetching } = useGetPayments(debouncedSearchQuery)

  const userIds = React.useMemo(
    () => (payments || []).map(prop('userId')),
    [payments]
  )
  const { data: users } = useUsersCompact(userIds, {
    enabled: !!userIds.length,
    retry: false,
  })
  const usersById = React.useMemo(
    () => (users || []).reduce(by('id'), {}),
    [users]
  )

  const filteredRecords = React.useMemo(() => {
    return payments?.filter((x) => {
      return !!matchSearch(x.User, debouncedSearchQuery)
    })
  }, [payments, debouncedSearchQuery])

  const columns = React.useMemo(
    () => [
      {
        Header: 'User',
        accessor: (one: any) => {
          const user = usersById[one.userId]
          return <UserLabel user={user} />
        },
      },
      {
        Header: 'Amount',
        accessor: (one: any) => <div>{one.amount}</div>,
      },
      {
        Header: 'Currency',
        accessor: (one: any) => <div>{one.currency}</div>,
      },
      {
        Header: 'Membership',
        accessor: (one: any) => (
          <div>
            {`${one.purchasedProductReference.name}  ${one.purchasedProductReference.duration}`}
            {hasMembershipExpired(
              one.createdAt,
              one.purchasedProductReference.type,
              one.purchasedProductReference.duration
            ) ? (
              <Tag color="red" size="small">
                Expired
              </Tag>
            ) : (
              <Tag color="green" size="small">
                Active
              </Tag>
            )}
          </div>
        ),
      },
      {
        Header: 'Payment date',
        accessor: (one: any) => (
          <div>{dayjs(one.createdAt).format(FRIENDLY_DATE_FORMAT)}</div>
        ),
      },
      {
        Header: 'Status',
        accessor: (one: any) => (
          <div>
            {one.status === 'success' ? (
              <Tag color="green" size="small">
                success
              </Tag>
            ) : (
              ''
            )}
          </div>
        ),
      },
      {
        Header: 'Invoice',
        accessor: (one: any) => (
          <Link href={`/payments/invoice/${one.id}`} kind="secondary">
            Link
          </Link>
        ),
      },
      {
        Header: 'Details',
        accessor: (one: any) => (
          <Link href={`/admin/payments/detail/${one.id}`} kind="secondary">
            Link
          </Link>
        ),
      },
    ],
    [usersById]
  )
  return (
    <WidgetWrapper>
      <div className="flex justify-between items-center mb-6">
        <H1 className="mb-0">Payments</H1>
        {/* <PermissionsValidator required={[Permissions.payments.__Admin]}> */}
        {/* // @todo correct permission */}
        {/* </PermissionsValidator> */}
      </div>

      <LabelWrapper label="Search user">
        <Input
          type="text"
          value={searchQuery}
          onChange={setSearchQuery}
          className="px-4 py-[8px]"
          placeholder="By name or email"
          containerClassName="w-full"
        />
      </LabelWrapper>
      {payments?.length ? (
        <div className="-mx-6 mt-6">
          {filteredRecords.length ? (
            <Table
              columns={columns}
              data={filteredRecords}
              paddingClassName="px-6"
            />
          ) : (
            <div className="text-center text-text-tertiary">No results</div>
          )}
        </div>
      ) : (
        <Placeholder children="No data" />
      )}
    </WidgetWrapper>
  )
}
