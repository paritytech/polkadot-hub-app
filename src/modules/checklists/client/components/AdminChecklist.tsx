import dayjs from 'dayjs'
import * as React from 'react'
import {
  Button,
  H1,
  Link,
  Table,
  Tag,
  WidgetWrapper,
} from '#client/components/ui'
import { Checklist, ChecklistType } from '#shared/types'
import { useDocumentTitle } from '#client/utils/hooks'
import { useChecklists } from '../queries'

export const AdminChecklist = () => {
  useDocumentTitle('Checklists')
  const { data: checklists = [] } = useChecklists()

  const columns = React.useMemo(
    () => [
      {
        Header: 'Title',
        accessor: (ch: Checklist) => (
          <Link kind="secondary" href={`/admin/checklists/${ch.id}`}>
            {ch.title}
          </Link>
        ),
      },
      {
        Header: 'User type',
        accessor: (ch: Checklist) => (
          <div>
            <Tag color="gray" size="small">
              {ch.type}
            </Tag>
            {ch.type === ChecklistType.new && (
              <span className="ml-2">
                since {dayjs(ch.joinedDate).format('D MMM YYYY')}
              </span>
            )}
          </div>
        ),
      },
      {
        Header: 'Offices',
        accessor: (ch: Checklist) => <div>{ch.offices.sort().join(', ')}</div>,
      },
      {
        id: '$$actions',
        Header: () => 'Actions',
        accessor: (x: Checklist) => (
          <Button
            kind="secondary"
            size="small"
            href={`/admin/checklists/${x.id}`}
          >
            Edit
          </Button>
        ),
      },
      {
        Header: 'Created at',
        accessor: (ch: Checklist) => (
          <div>{dayjs(ch.createdAt).format('D MMM YYYY, HH:mm')}</div>
        ),
      },
    ],
    []
  )

  return (
    <WidgetWrapper>
      <div className="flex flex-col sm:flex-row justify-start sm:justify-between mb-6 items-center">
        <H1 className="mb-0">Checklists</H1>
        <Button href="/admin/checklists/new" className="w-fit self-end">
          Create Checklist
        </Button>
      </div>

      {!!checklists?.length && (
        <div className="-mx-6">
          <Table columns={columns} data={checklists} paddingClassName="px-6" />
        </div>
      )}
    </WidgetWrapper>
  )
}
