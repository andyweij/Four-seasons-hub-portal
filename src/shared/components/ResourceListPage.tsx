import { useState } from 'react'
import { Pagination } from './Pagination'

type ResourceColumn = {
  key: string
  label: string
}

type ResourceRecord = Record<string, string>

type ResourceListPageProps = {
  eyebrow: string
  title: string
  description: string
  primaryAction: string
  columns: ResourceColumn[]
  records: ResourceRecord[]
  emptyMessage: string
}

const pageSize = 5

export function ResourceListPage({
  eyebrow,
  title,
  description,
  primaryAction,
  columns,
  records,
  emptyMessage,
}: ResourceListPageProps) {
  const [page, setPage] = useState(1)
  const start = (page - 1) * pageSize
  const visibleRecords = records.slice(start, start + pageSize)

  return (
    <section>
      <header className="page-header page-header-with-action">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <button type="button" className="primary-button" disabled title="Gateway API 尚未串接">
          {primaryAction}
        </button>
      </header>

      <article className="data-card">
        {records.length === 0 ? (
          <div className="empty-state">
            <strong>尚無資料</strong>
            <p>{emptyMessage}</p>
          </div>
        ) : (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
                </thead>
                <tbody>
                  {visibleRecords.map((record, index) => (
                    <tr key={`${record[columns[0].key]}-${index}`}>
                      {columns.map((column) => <td key={column.key}>{record[column.key]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageSize={pageSize} totalItems={records.length} onPageChange={setPage} />
          </>
        )}
      </article>
    </section>
  )
}
