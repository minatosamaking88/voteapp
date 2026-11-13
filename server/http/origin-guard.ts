import type { RequestHandler } from "express";
import { config } from "../config.js";
import { sendApiError } from "./errors.js";

export const originGuard: RequestHandler = (request, response, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    next();
    return;
  }

  const fetchSite = request.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    sendApiError(
      response,
      403,
      "CROSS_SITE_REQUEST",
      "Cross-site requests are not allowed.",
    );
    return;
  }

  const origin = request.get("origin");
  if (!origin) {
    sendApiError(
      response,
      403,
      "ORIGIN_REQUIRED",
      "Send this request from the feature board.",
    );
    return;
  }

  try {
    const originHost = new URL(origin).host;
    const configuredHost = new URL(config.webOrigin).host;
    if (originHost !== configuredHost && originHost !== request.get("host")) {
      sendApiError(
        response,
        403,
        "CROSS_SITE_REQUEST",
        "Cross-site requests are not allowed.",
      );
      return;
    }
  } catch {
    sendApiError(
      response,
      403,
      "CROSS_SITE_REQUEST",
      "Cross-site requests are not allowed.",
    );
    return;
  }

  next();
};
