import express, { type Express } from "express";
import { adminRouter } from "./admin/routes.js";
import { authRouter } from "./auth/routes.js";
import { featureRouter } from "./features/routes.js";
import { config } from "./config.js";
import { sendApiError, errorHandler } from "./http/errors.js";
import { originGuard } from "./http/origin-guard.js";

export function createApp(clientDistPath?: string): Express {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", config.trustProxyHops);
  app.use((_request, response, next) => {
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Frame-Options", "DENY");
    response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    if (config.secureCookies) {
      response.setHeader("Strict-Transport-Security", "max-age=31536000");
      response.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
      );
    }
    next();
  });
  app.use(express.json({ limit: "20kb" }));
  app.use("/api", originGuard);
  app.use("/api/auth", authRouter);
  app.use("/api/features", featureRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api", (_request, response) => {
    sendApiError(
      response,
      404,
      "API_NOT_FOUND",
      "This API endpoint does not exist.",
    );
  });

  if (clientDistPath) {
    app.use(express.static(clientDistPath, { index: false, maxAge: "1h" }));
    app.get(/.*/, (_request, response, next) => {
      response.sendFile("index.html", { root: clientDistPath }, (error) => {
        if (error) next(error);
      });
    });
  }

  app.use((_request, response) => {
    sendApiError(response, 404, "NOT_FOUND", "This page does not exist.");
  });
  app.use(errorHandler);

  return app;
}
