export interface PaginationParams {
  page?: number | string;
  limit?: number | string;
}

export interface PaginationResult {
  page: number;
  limit: number;
  skip: number;
}

export function resolvePagination(
  params: PaginationParams,
  maxLimit = 100,
): PaginationResult {
  const page = Math.max(Number(params.page ?? 1) || 1, 1);
  const limit = Math.min(
    Math.max(Number(params.limit ?? 20) || 20, 1),
    maxLimit,
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function buildPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
) {
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
