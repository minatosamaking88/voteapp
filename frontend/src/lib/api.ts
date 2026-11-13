const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
    fieldErrors?: Record<string, string[]>;
  };
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly fieldErrors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body !== undefined) headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'same-origin',
  });
  if (response.status === 204) return undefined as T;

  const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
  if (!response.ok) {
    throw new ApiError(
      body?.error?.message ?? 'Something went wrong. Please try again.',
      response.status,
      body?.error?.code ?? 'REQUEST_FAILED',
      body?.error?.fieldErrors ?? {},
    );
  }

  return body as T;
}
