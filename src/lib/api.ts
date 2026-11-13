import type { ApiErrorResponse } from "../../shared/contracts";

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function apiRequest<ResponseBody>(
  path: string,
  options: RequestInit = {},
): Promise<ResponseBody> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...options,
    headers,
    credentials: "same-origin",
  });
  if (response.status === 204) return undefined as ResponseBody;

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiClientError(
      "The server returned an unreadable response. Try again.",
      response.status,
      "INVALID_RESPONSE",
    );
  }

  if (!response.ok) {
    const apiError =
      typeof body === "object" && body !== null
        ? (body as ApiErrorResponse).error
        : undefined;
    throw new ApiClientError(
      apiError?.message ?? "The request failed. Try again.",
      response.status,
      apiError?.code ?? "REQUEST_FAILED",
    );
  }

  return body as ResponseBody;
}

export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
