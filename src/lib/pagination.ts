export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  has_more: boolean;
}

interface PaginationOptions {
  defaultPageSize?: number;
  maxPageSize?: number;
}

export function parsePagination(
  searchParams: URLSearchParams,
  options: PaginationOptions = {},
): { page: number; pageSize: number; from: number; to: number } {
  const defaultPageSize = options.defaultPageSize ?? 8;
  const maxPageSize = options.maxPageSize ?? 50;
  const rawPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const rawPageSize = Number.parseInt(searchParams.get("page_size") ?? String(defaultPageSize), 10);
  const page = Number.isFinite(rawPage) ? Math.max(rawPage, 1) : 1;
  const pageSize = Number.isFinite(rawPageSize)
    ? Math.min(Math.max(rawPageSize, 1), maxPageSize)
    : defaultPageSize;
  const from = (page - 1) * pageSize;

  return { page, pageSize, from, to: from + pageSize - 1 };
}

export function createPagination(page: number, pageSize: number, total: number): PaginationMeta {
  return {
    page,
    page_size: pageSize,
    total,
    has_more: page * pageSize < total,
  };
}
