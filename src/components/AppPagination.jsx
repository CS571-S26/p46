import { Pagination } from 'react-bootstrap'

const WINDOW = 5

export default function AppPagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const half = Math.floor(WINDOW / 2)
  let start = Math.max(1, page - half)
  let end = Math.min(totalPages, start + WINDOW - 1)
  if (end - start < WINDOW - 1) start = Math.max(1, end - WINDOW + 1)

  const items = []
  for (let n = start; n <= end; n++) {
    items.push(
      <Pagination.Item key={n} active={n === page} onClick={() => onPageChange(n)}>
        {n}
      </Pagination.Item>
    )
  }

  return (
    <div className="d-flex justify-content-center mt-3 mb-1">
      <Pagination size="sm" className="mb-0">
        <Pagination.First disabled={page === 1} onClick={() => onPageChange(1)} />
        <Pagination.Prev  disabled={page === 1} onClick={() => onPageChange(page - 1)} />
        {items}
        <Pagination.Next  disabled={page === totalPages} onClick={() => onPageChange(page + 1)} />
        <Pagination.Last  disabled={page === totalPages} onClick={() => onPageChange(totalPages)} />
      </Pagination>
    </div>
  )
}
