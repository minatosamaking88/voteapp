import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import express from "express";
import { ApiError, errorHandler } from "./api-error.js";
import { requireAuthentication } from "./auth.js";
import authRouter from "./routes/auth.js";
import featureRouter from "./routes/features.js";

export const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/features", requireAuthentication, featureRouter);
app.use("/api", (_request, _response, next) => {
  next(
    new ApiError(404, "NOT_FOUND", "The requested API route was not found."),
  );
});

if (process.env.NODE_ENV === "production") {
  const clientDirectory = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../../client/dist",
  );
  app.use(express.static(clientDirectory, { index: false }));
  app.use((request, response, next) => {
    if (request.method === "GET" && !request.path.startsWith("/api/")) {
      response.sendFile(resolve(clientDirectory, "index.html"));
      return;
    }
    next();
  });
}

app.use((_request, _response, next) => {
  next(new ApiError(404, "NOT_FOUND", "The requested page was not found."));
});
app.use(errorHandler);
