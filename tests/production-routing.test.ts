import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../server/app.js";

let staticDirectory = "";
afterAll(async () => {
  if (staticDirectory)
    await rm(staticDirectory, { recursive: true, force: true });
});

describe("production frontend routing", () => {
  it("serves the app entry for frontend deep links and JSON for unknown API paths", async () => {
    staticDirectory = await mkdtemp(join(tmpdir(), "feature-board-static-"));
    await writeFile(
      join(staticDirectory, "index.html"),
      "<!doctype html><title>Feature Board</title>",
    );
    const app = createApp(staticDirectory);

    const deepLink = await request(app).get("/admin");
    const unknownApi = await request(app).get("/api/unknown-route");

    expect(deepLink.status).toBe(200);
    expect(deepLink.text).toContain("Feature Board");
    expect(unknownApi.status).toBe(404);
    expect(unknownApi.headers["content-type"]).toContain("application/json");
    expect(unknownApi.body.error.code).toBe("API_NOT_FOUND");
  });
});
