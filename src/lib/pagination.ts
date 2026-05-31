import { useEffect, useMemo, useState } from "react";

export const LIST_PAGE_SIZE = 10;

export function usePaginatedList<T>(items: T[], resetKey?: string | number) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / LIST_PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [resetKey]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * LIST_PAGE_SIZE;
    return items.slice(start, start + LIST_PAGE_SIZE);
  }, [items, currentPage]);

  const pageStart = items.length === 0 ? 0 : (currentPage - 1) * LIST_PAGE_SIZE + 1;
  const pageEnd = Math.min(currentPage * LIST_PAGE_SIZE, items.length);

  return {
    paginatedItems,
    currentPage,
    totalPages,
    pageStart,
    pageEnd,
    totalItems: items.length,
    showPagination: items.length > LIST_PAGE_SIZE,
    goToPreviousPage: () => setCurrentPage((p) => Math.max(1, p - 1)),
    goToNextPage: () => setCurrentPage((p) => Math.min(totalPages, p + 1)),
  };
}
