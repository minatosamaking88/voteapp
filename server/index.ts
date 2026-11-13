import "dotenv/config";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { config } from "./config.js";
import { prisma } from "./db/prisma.js";

const serverDirectory = dirname(fileURLToPath(import.meta.url));
const clientDirectory =
  config.environment === "production"
    ? resolve(serverDirectory, "../client")
    : undefined;
const app = createApp(clientDirectory);
const server = app.listen(config.port, () => {
  console.info(`Feature board listening on port ${config.port}`);
});

function shutDown(): void {
  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0));
  });
}

process.on("SIGINT", shutDown);
process.on("SIGTERM", shutDown);
