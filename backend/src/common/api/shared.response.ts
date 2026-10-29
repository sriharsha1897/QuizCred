export interface ApiSuccessResponse<TData> {
  message: string;
  data: TData;
}

export interface ApiListResponse<TItem> {
  items: TItem[];
}

export interface HealthResponse {
  status: 'ok';
}

/** Error bodies from {@link AllExceptionsFilter} — not wrapped in {@link ApiSuccessResponse}. */
export interface ApiErrorResponse {
  statusCode: number;
  code: string;
  message: string;
}
