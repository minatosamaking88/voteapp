import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set before the API starts.");
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
  ssl: false,
});

export const prisma = new PrismaClient({ adapter });
