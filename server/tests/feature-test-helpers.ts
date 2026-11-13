import { randomUUID } from "node:crypto";
import { expect } from "vitest";
import request from "supertest";
import type { FeatureItem } from "@featurevote/shared/contracts";
import { app } from "../src/app.js";
import { prisma } from "../src/db.js";

const createdUserIds: string[] = [];
const testPassword = "secure-password-123";

export type TestAccount = {
  id: string;
  email: string;
  cookie: string;
  password: string;
};

export async function createAccount(name: string): Promise<TestAccount> {
  const email = `${randomUUID()}@example.test`;
  const response = await request(app).post("/api/auth/register").send({
    name,
    email,
    password: testPassword,
  });
  expect(response.status).toBe(201);
  const cookie = response.headers["set-cookie"]?.[0]?.split(";")[0];
  if (!cookie) throw new Error("Registration did not return a session cookie.");
  const id = response.body.user.id as string;
  createdUserIds.push(id);
  return { id, email, cookie, password: testPassword };
}

export async function createFeature(
  cookie: string,
  title: string,
): Promise<FeatureItem> {
  const response = await request(app)
    .post("/api/features")
    .set("Cookie", cookie)
    .send({
      title,
      description: `A clear product improvement for ${title.toLowerCase()}.`,
    });
  expect(response.status).toBe(201);
  return response.body as FeatureItem;
}

export async function cleanupTestAccounts(): Promise<void> {
  if (createdUserIds.length === 0) return;
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  createdUserIds.length = 0;
}
