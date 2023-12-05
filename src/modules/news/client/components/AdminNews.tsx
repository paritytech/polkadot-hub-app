import React from 'react'
import { useStore } from '@nanostores/react'
import * as stores from '#client/stores'
import { Button, H1, Link, Table, UserLabel } from '#client/components/ui'
import { PermissionsValidator } from '#client/components/PermissionsValidator'
import { useUsersCompact } from '#modules/users/client/queries'
import { trimString } from '#client/utils'
import { by, prop } from '#shared/utils/fp'
import { useDocumentTitle } from '#client/utils/hooks'
import Permissions from '#shared/permissions'
import { useAdminNews } from '../queries'

export const AdminNews = () => (
  <PermissionsValidator
    required={[Permissions.news.__Admin, Permissions.news.AdminList]}
    onRejectGoHome
  >
    <_AdminNews />
  </PermissionsValidator>
)

export const _AdminNews = () => {
  useDocumentTitle('News')
  const officeId = useStore(stores.officeId)
  const { data: news, isFetching } = useAdminNews(officeId)
  const userIds = React.useMemo(
    () => (news || []).map(prop('creatorUserId')),
    [news]
  )
  const { data: users } = useUsersCompact(userIds, {
    enabled: !!userIds.length,
    retry: false,
  })
  const usersById = React.useMemo(
    () => (users || []).reduce(by('id'), {}),
    [users]
  )
  // @todo implement soft delete
  // const onRemove = React.useCallback(
  //   (one: any) => (ev: React.MouseEvent<HTMLElement>) => {
  //     ev.preventDefault()
  //     if (
  //       confirm(
  //         `Are you sure you want to permanently delete "${one.title}" event? This will automatically delete all applications.`
  //       )
  //     ) {
  //       // deleteNews(event.id)
  //     }
  //   },
  //   []
  // )
  const columns = React.useMemo(
    () => [
      {
        Header: 'Title',
        accessor: (one: any) => (
          <Link href={`/admin/news/${one.id}`} kind="secondary">
            {trimString(one.title)}
          </Link>
        ),
      },
      {
        Header: 'Creator',
        accessor: (one: any) => {
          const user = usersById[one.creatorUserId]
          return <UserLabel user={user} hideRole />
        },
      },
      {
        Header: 'Published',
        accessor: (one: any) => <div>{!one.published ? 'No' : 'Yes'}</div>,
      },
      {
        Header: 'Offices',
        accessor: (one: any) => <div>{one.offices.join(', ')}</div>,
      },
      {
        Header: 'News Link',
        accessor: (one: any) => (
          <Link href={`/news/${one.id}`} kind="secondary">
            Link
          </Link>
        ),
      },
      // @todo implement soft delete
      // {
      //   Header: 'Actions',
      //   accessor: (article: any) => (
      //     <span>
      //       <Button size="small" onClick={onRemove(article)}>
      //         Delete
      //       </Button>
      //     </span>
      //   ),
      // },
    ],
    [usersById]
  )
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <H1>News</H1>
        <PermissionsValidator required={[Permissions.news.AdminManage]}>
          <Button href="/admin/news/new">Create news</Button>
        </PermissionsValidator>
      </div>
      {news?.length ? (
        <div className="-mx-8">
          <Table columns={columns} data={news} />
        </div>
      ) : (
        <div className="text-gray-400 text-center my-12">No data</div>
      )}
    </div>
  )
}
