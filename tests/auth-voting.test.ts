import { createHash, randomBytes } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { Role } from "../generated/prisma/client.js";
import { config } from "../server/config.js";
import { createApp } from "../server/app.js";
import { prisma } from "../server/db/prisma.js";
import { sessionCookieName } from "../server/auth/session.js";

const app = createApp();
const requestOrigin = config.webOrigin;
let adminToken = "";
let userAToken = "";
let userAId = "";
let adminId = "";

async function createAccount(email: string, role: Role): Promise<string> {
  const user = await prisma.user.create({
    data: {
      email,
      name: email.split("@")[0] ?? "Test user",
      passwordHash: "test-hash",
      role,
    },
  });
  return user.id;
}

async function createSession(userId: string): Promise<string> {
  const token = randomBytes(24).toString("hex");
  await prisma.session.create({
    data: {
      tokenHash: createHash("sha256").update(token).digest("hex"),
      userId,
      expiresAt: new Date(Date.now() + 60_000),
    },
  });
  return token;
}

function withSession(token: string) {
  return { Cookie: `${sessionCookieName}=${token}`, Origin: requestOrigin };
}

beforeEach(async () => {
  await prisma.session.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.feature.deleteMany();
  await prisma.user.deleteMany();
  adminId = await createAccount("admin-vote@test.example", Role.ADMIN);
  userAId = await createAccount("user-vote@test.example", Role.USER);
  adminToken = await createSession(adminId);
  userAToken = await createSession(userAId);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("account sessions", () => {
  it("registers only a regular User, persists a session, and supports sign-in", async () => {
    const credentials = {
      name: "Taylor Morgan",
      email: "new-user@test.example",
      password: "a-very-secure-password",
    };
    const registration = await request(app)
      .post("/api/auth/register")
      .set("Origin", requestOrigin)
      .send(credentials);
    const cookieHeader = registration.headers["set-cookie"];
    const sessionCookie = Array.isArray(cookieHeader)
      ? cookieHeader[0]
      : cookieHeader;
    if (!sessionCookie)
      throw new Error("Registration did not create a session cookie.");
    const cookiePair = sessionCookie.split(";")[0];
    if (!cookiePair)
      throw new Error("Registration returned an empty session cookie.");
    const currentUser = await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookiePair);
    const duplicate = await request(app)
      .post("/api/auth/register")
      .set("Origin", requestOrigin)
      .send(credentials);
    const wrongPassword = await request(app)
      .post("/api/auth/login")
      .set("Origin", requestOrigin)
      .send({ email: credentials.email, password: "incorrect-password" });
    const login = await request(app)
      .post("/api/auth/login")
      .set("Origin", requestOrigin)
      .send({ email: credentials.email, password: credentials.password });

    expect(registration.status).toBe(201);
    expect(registration.body.user.role).toBe("USER");
    expect(sessionCookie).toContain("HttpOnly");
    expect(sessionCookie).toContain("SameSite=Lax");
    expect(currentUser.body.user.email).toBe(credentials.email);
    expect(duplicate.status).toBe(409);
    expect(wrongPassword.status).toBe(401);
    expect(login.status).toBe(200);
    expect(login.body.user.role).toBe("USER");
  });
});

describe("feature voting", () => {
  it("enforces one vote per user, blocks self-votes, and leaves Admin board access intact", async () => {
    const feature = await prisma.feature.create({
      data: { title: "A voteable request", authorId: userAId },
    });
    const ownVote = await request(app)
      .post(`/api/features/${feature.id}/votes`)
      .set(withSession(userAToken));
    const adminVote = await request(app)
      .post(`/api/features/${feature.id}/votes`)
      .set(withSession(adminToken));
    const repeatedVote = await request(app)
      .post(`/api/features/${feature.id}/votes`)
      .set(withSession(adminToken));
    const adminFeature = await request(app)
      .post("/api/features")
      .set(withSession(adminToken))
      .send({ title: "An administrator's own request" });

    expect(ownVote.status).toBe(403);
    expect(adminVote.status).toBe(200);
    expect(adminVote.body.votes).toBe(1);
    expect(adminVote.body.hasVotedByMe).toBe(true);
    expect(repeatedVote.status).toBe(409);
    expect(adminFeature.status).toBe(201);
    expect(adminFeature.body.author.id).toBe(adminId);
  });
});
