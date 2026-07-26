type PaginationItem = number | 'ellipsis'

type PaginationProps = {
  /** 目前頁碼，從 1 開始。 */
  page: number
  /** 每頁筆數。 */
  pageSize: number
  /** 後端回傳的完整資料筆數。 */
  totalItems: number
  /** 使用者切換頁碼時呼叫。 */
  onPageChange: (page: number) => void
  /** 最多顯示的相鄰頁碼數，不含首頁與末頁。 */
  siblingCount?: number
  className?: string
}

function getPageItems(currentPage: number, totalPages: number, siblingCount: number): PaginationItem[] {
  const visiblePageCount = siblingCount * 2 + 5

  if (totalPages <= visiblePageCount) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const leftSibling = Math.max(currentPage - siblingCount, 2)
  const rightSibling = Math.min(currentPage + siblingCount, totalPages - 1)
  const items: PaginationItem[] = [1]

  if (leftSibling > 2) items.push('ellipsis')
  for (let page = leftSibling; page <= rightSibling; page += 1) items.push(page)
  if (rightSibling < totalPages - 1) items.push('ellipsis')

  items.push(totalPages)
  return items
}

export function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  siblingCount = 1,
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const currentPage = Math.min(Math.max(page, 1), totalPages)
  const pageItems = getPageItems(currentPage, totalPages, siblingCount)
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  if (totalItems === 0) return null

  return (
    <nav className={['pagination', className].filter(Boolean).join(' ')} aria-label="分頁導覽">
      <p className="pagination-summary">顯示 {startItem}–{endItem} 筆，共 {totalItems} 筆</p>
      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          上一頁
        </button>
        {pageItems.map((item, index) => item === 'ellipsis' ? (
          <span className="pagination-ellipsis" key={`ellipsis-${index}`} aria-hidden="true">…</span>
        ) : (
          <button
            type="button"
            className="pagination-button"
            key={item}
            onClick={() => onPageChange(item)}
            aria-current={item === currentPage ? 'page' : undefined}
          >
            {item}
          </button>
        ))}
        <button
          type="button"
          className="pagination-button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          下一頁
        </button>
      </div>
    </nav>
  )
}
