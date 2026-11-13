import type { ErrorRequestHandler, Request, Response } from "express";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: Array<{ path: string; message: string }>,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function sendValidationError(response: Response, error: ZodError): void {
  response.status(400).json({
    error: {
      code: "VALIDATION_ERROR",
      message: "Check the request values and try again.",
      details: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    },
  });
}

export function sendApiError(
  response: Response,
  status: number,
  code: string,
  message: string,
): void {
  response.status(status).json({ error: { code, message } });
}

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request: Request,
  response: Response,
  next,
) => {
  void next;
  if (error instanceof HttpError) {
    response.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    });
    return;
  }

  if (
    error instanceof SyntaxError &&
    "status" in error &&
    error.status === 400
  ) {
    sendApiError(
      response,
      400,
      "INVALID_JSON",
      "Request body must contain valid JSON.",
    );
    return;
  }

  console.error("Unhandled API error", error);
  sendApiError(
    response,
    500,
    "INTERNAL_ERROR",
    "Something went wrong. Try again.",
  );
};
