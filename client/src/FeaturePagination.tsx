type FeaturePaginationProps = {
  total: number;
  page: number;
  pageSize: number;
  search: string;
};

export function FeaturePagination({
  total,
  page,
  pageSize,
  search,
}: FeaturePaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const firstResult = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastResult = Math.min(page * pageSize, total);

  function changePage(nextPage: number) {
    const filters = new URLSearchParams(search);
    filters.set("page", String(nextPage));
    window.location.assign(`/features?${filters.toString()}`);
  }

  return (
    <nav className="pagination" aria-label="Pagination">
      <p>
        Showing {firstResult}–{lastResult} of {total}
      </p>
      <div className="pagination-actions">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => changePage(page - 1)}
        >
          Previous
        </button>
        <span aria-current="page">
          Page {page} of {pageCount}
        </span>
        <button
          type="button"
          disabled={page >= pageCount}
          onClick={() => changePage(page + 1)}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
