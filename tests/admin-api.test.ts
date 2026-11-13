import { createHash, randomBytes } from "node:crypto";
import { beforeEach, afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { Role, FeatureStatus } from "../generated/prisma/client.js";
import { config } from "../server/config.js";
import { createApp } from "../server/app.js";
import { prisma } from "../server/db/prisma.js";
import { sessionCookieName } from "../server/auth/session.js";

const app = createApp();
const requestOrigin = config.webOrigin;
let adminId = "";
let userAId = "";
let userBId = "";
let adminToken = "";
let userAToken = "";
let userBToken = "";

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

async function createFeature(
  authorId: string,
  status: FeatureStatus = FeatureStatus.PLANNED,
) {
  return prisma.feature.create({
    data: { title: "A test feature request", authorId, status },
  });
}

beforeEach(async () => {
  await prisma.session.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.feature.deleteMany();
  await prisma.user.deleteMany();

  adminId = await createAccount("admin@test.example", Role.ADMIN);
  userAId = await createAccount("user-a@test.example", Role.USER);
  userBId = await createAccount("user-b@test.example", Role.USER);
  adminToken = await createSession(adminId);
  userAToken = await createSession(userAId);
  userBToken = await createSession(userBId);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Admin API authorization", () => {
  it("rejects anonymous summary and status requests with 401", async () => {
    const summary = await request(app).get("/api/admin/summary");
    const update = await request(app)
      .patch("/api/admin/features/7c12c1b2-9ea5-4eb3-a248-b7dd04061001/status")
      .set("Origin", requestOrigin)
      .send({ status: "SHIPPED" });

    expect(summary.status).toBe(401);
    expect(summary.body.error.code).toBe("UNAUTHENTICATED");
    expect(update.status).toBe(401);
  });

  it("denies regular users access to Admin APIs", async () => {
    const feature = await createFeature(userAId);
    const summary = await request(app)
      .get("/api/admin/summary")
      .set(withSession(userAToken));
    const update = await request(app)
      .patch(`/api/admin/features/${feature.id}/status`)
      .set(withSession(userAToken))
      .send({ status: "SHIPPED" });

    expect(summary.status).toBe(403);
    expect(update.status).toBe(403);
    expect(update.body.error.code).toBe("FORBIDDEN");
  });
});

describe("Admin feature status", () => {
  it("accepts every supported status and returns the updated board shape", async () => {
    const feature = await createFeature(userAId);

    for (const status of ["PLANNED", "IN_PROGRESS", "SHIPPED"] as const) {
      const response = await request(app)
        .patch(`/api/admin/features/${feature.id}/status`)
        .set(withSession(adminToken))
        .send({ status });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: feature.id,
        title: feature.title,
        status,
        author: { id: userAId },
        votes: 0,
      });
    }
  });

  it("returns 400 for invalid UUIDs and statuses and 404 for missing features", async () => {
    const invalidId = await request(app)
      .patch("/api/admin/features/not-a-uuid/status")
      .set(withSession(adminToken))
      .send({ status: "SHIPPED" });
    const invalidStatus = await request(app)
      .patch("/api/admin/features/7c12c1b2-9ea5-4eb3-a248-b7dd04061001/status")
      .set(withSession(adminToken))
      .send({ status: "BUILDING" });
    const missingFeature = await request(app)
      .patch("/api/admin/features/7c12c1b2-9ea5-4eb3-a248-b7dd04061001/status")
      .set(withSession(adminToken))
      .send({ status: "SHIPPED" });

    expect(invalidId.status).toBe(400);
    expect(invalidStatus.status).toBe(400);
    expect(missingFeature.status).toBe(404);
  });

  it("preserves author, creation date, and votes while making the new status visible on the board", async () => {
    const createdAt = new Date("2024-02-10T10:00:00.000Z");
    const feature = await prisma.feature.create({
      data: {
        title: "A preserved feature request",
        authorId: userAId,
        createdAt,
      },
    });
    await prisma.vote.create({
      data: { featureId: feature.id, userId: userBId },
    });

    const updated = await request(app)
      .patch(`/api/admin/features/${feature.id}/status`)
      .set(withSession(adminToken))
      .send({ status: "IN_PROGRESS" });
    const stored = await prisma.feature.findUniqueOrThrow({
      where: { id: feature.id },
      include: { _count: { select: { votes: true } } },
    });
    const board = await request(app)
      .get(`/api/features?q=${encodeURIComponent(feature.title)}`)
      .set(withSession(userBToken));

    expect(updated.body.status).toBe("IN_PROGRESS");
    expect(stored.authorId).toBe(userAId);
    expect(stored.createdAt.toISOString()).toBe(createdAt.toISOString());
    expect(stored._count.votes).toBe(1);
    expect(board.body.items[0].status).toBe("IN_PROGRESS");
    expect(board.body.items[0].votes).toBe(1);
  });

  it("calculates complete summary counts independent of board filters and pagination", async () => {
    await createFeature(userAId, FeatureStatus.PLANNED);
    await createFeature(userBId, FeatureStatus.PLANNED);
    await createFeature(userAId, FeatureStatus.IN_PROGRESS);
    await createFeature(userBId, FeatureStatus.SHIPPED);

    const summary = await request(app)
      .get("/api/admin/summary")
      .set(withSession(adminToken));
    const filteredList = await request(app)
      .get("/api/features?status=SHIPPED&page=1&pageSize=1")
      .set(withSession(adminToken));

    expect(summary.body).toEqual({
      total: 4,
      planned: 2,
      inProgress: 1,
      shipped: 1,
    });
    expect(filteredList.body.items).toHaveLength(1);
    expect(filteredList.body.total).toBe(1);
    expect(summary.body.total).toBe(4);
  });
});

describe("Shared board workflow", () => {
  it("lets User A submit, User B vote, and both see an Admin status change after reload", async () => {
    const submitted = await request(app)
      .post("/api/features")
      .set(withSession(userAToken))
      .send({ title: "An easier way to track roadmap progress" });
    const voted = await request(app)
      .post(`/api/features/${submitted.body.id}/votes`)
      .set(withSession(userBToken));
    const updated = await request(app)
      .patch(`/api/admin/features/${submitted.body.id}/status`)
      .set(withSession(adminToken))
      .send({ status: "IN_PROGRESS" });
    const userAView = await request(app)
      .get("/api/features")
      .set(withSession(userAToken));
    const userBView = await request(app)
      .get("/api/features")
      .set(withSession(userBToken));
    const summary = await request(app)
      .get("/api/admin/summary")
      .set(withSession(adminToken));

    expect(submitted.status).toBe(201);
    expect(voted.body.votes).toBe(1);
    expect(updated.body.status).toBe("IN_PROGRESS");
    expect(userAView.body.items[0]).toMatchObject({
      status: "IN_PROGRESS",
      votes: 1,
    });
    expect(userBView.body.items[0]).toMatchObject({
      status: "IN_PROGRESS",
      votes: 1,
    });
    expect(summary.body).toMatchObject({ total: 1, inProgress: 1 });
  });
});
