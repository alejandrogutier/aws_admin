export type ApiResponse<T> =
  | { data: T; error?: never }
  | { data?: never; error: string; code: number };

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
};
