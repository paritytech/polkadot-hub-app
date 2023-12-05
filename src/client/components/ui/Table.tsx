import React from 'react'
import { useTable, UseTableOptions } from 'react-table'
import { cn } from '#client/utils'

type ReactComponent<X> = (x: X) => string | Element | JSX.Element | null
type Header<X> = { id: string; Header: ReactComponent<X> } | { Header: string }
interface Props<Datum> {
  data: Datum[]
  columns: Array<
    Header<Datum> & {
      accessor: string | ReactComponent<Datum>
    }
  >
  className?: string
  paddingClassName?: string
}

export const Table = <Datum,>(
  props: React.PropsWithChildren<Props<Datum>> & { hideHeader?: boolean }
) => {
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable({
      columns: props.columns,
      data: props.data,
    } as UseTableOptions<Record<string, any>>)
  return (
    <div className={cn('phq_table', props.className)}>
      <div
        className={cn('phq_table-container', props.paddingClassName || 'px-8')}
      >
        <table {...getTableProps()}>
          {!props.hideHeader && (
            <thead>
              {headerGroups.map((headerGroup) => (
                // eslint-disable-next-line react/jsx-key
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((column) => (
                    // eslint-disable-next-line react/jsx-key
                    <th {...column.getHeaderProps()}>
                      {column.render('Header')}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
          )}
          <tbody {...getTableBodyProps()}>
            {rows.map((row) => {
              prepareRow(row)
              return (
                // eslint-disable-next-line react/jsx-key
                <tr {...row.getRowProps()}>
                  {row.cells.map((cell) => {
                    return (
                      // eslint-disable-next-line react/jsx-key
                      <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
