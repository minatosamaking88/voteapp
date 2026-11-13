import { afterAll, afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { FeatureItem } from "@featurevote/shared/contracts";
import { app } from "../src/app.js";
import { prisma } from "../src/db.js";
import {
  cleanupTestAccounts,
  createAccount,
  createFeature,
} from "./feature-test-helpers.js";

afterEach(cleanupTestAccounts);
afterAll(async () => {
  await prisma.$disconnect();
});

describe("feature API", () => {
  it("creates a trimmed Planned feature and rejects invalid content", async () => {
    const author = await createAccount("Sam Patel");
    const invalid = await request(app)
      .post("/api/features")
      .set("Cookie", author.cookie)
      .send({ title: "tiny", description: "too short" });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.fieldErrors).toHaveProperty("title");
    expect(invalid.body.error.fieldErrors).toHaveProperty("description");

    const response = await request(app)
      .post("/api/features")
      .set("Cookie", author.cookie)
      .send({
        title: "  Export roadmap data  ",
        description:
          "  Let teams download roadmap information for their reports.  ",
      });
    expect(response.status).toBe(201);
    expect(response.body.title).toBe("Export roadmap data");
    expect(response.body.description).toBe(
      "Let teams download roadmap information for their reports.",
    );
    expect(response.body.status).toBe("PLANNED");
    expect(response.body.voteCount).toBe(0);
    expect(response.body.hasVoted).toBe(false);
    expect(response.body.author).toEqual({ id: author.id, name: "Sam Patel" });
    expect(response.body.author).not.toHaveProperty("email");

    const storedFeature = await prisma.feature.findUnique({
      where: { id: response.body.id as string },
      include: { votes: true },
    });
    expect(storedFeature?.authorId).toBe(author.id);
    expect(storedFeature?.status).toBe("PLANNED");
    expect(storedFeature?.votes).toHaveLength(0);
  });

  it("combines case-insensitive search, status, sorting, and pagination", async () => {
    const author = await createAccount("Taylor Nguyen");
    const voter = await createAccount("Jamie Brooks");
    const plannedTop = await createFeature(
      author.cookie,
      "Atlas meeting reminders",
    );
    const plannedNext = await createFeature(
      author.cookie,
      "Atlas search shortcuts",
    );
    const zeroVoteTie = await createFeature(
      author.cookie,
      "Atlas team digests",
    );
    const inProgress = await createFeature(
      author.cookie,
      "Atlas calendar view",
    );
    const shipped = await createFeature(
      author.cookie,
      "Roadmap export history",
    );
    const fixedCreatedAt = new Date("2025-04-14T12:00:00.000Z");

    await prisma.feature.updateMany({
      where: {
        id: {
          in: [
            plannedTop.id,
            plannedNext.id,
            zeroVoteTie.id,
            inProgress.id,
            shipped.id,
          ],
        },
      },
      data: { createdAt: fixedCreatedAt },
    });
    await prisma.feature.update({
      where: { id: inProgress.id },
      data: { status: "IN_PROGRESS" },
    });
    await prisma.feature.update({
      where: { id: shipped.id },
      data: { status: "SHIPPED" },
    });
    await prisma.vote.createMany({
      data: [
        { userId: author.id, featureId: plannedTop.id },
        { userId: voter.id, featureId: plannedTop.id },
      ],
    });
    const inProgressVote = await request(app)
      .put(`/api/features/${inProgress.id}/vote`)
      .set("Cookie", author.cookie);
    expect(inProgressVote.status).toBe(200);

    const defaultSort = await request(app)
      .get("/api/features")
      .set("Cookie", author.cookie)
      .query({ q: "atlas" });
    expect(defaultSort.body.pageSize).toBe(20);
    expect(defaultSort.body.items.map((item: FeatureItem) => item.id)).toEqual([
      plannedTop.id,
      inProgress.id,
      ...[plannedNext.id, zeroVoteTie.id].sort(),
    ]);

    const firstPage = await request(app)
      .get("/api/features")
      .set("Cookie", author.cookie)
      .query({
        q: "ATLAS",
        status: "PLANNED",
        sort: "votes",
        page: 1,
        pageSize: 1,
      });
    expect(firstPage.status).toBe(200);
    expect(firstPage.body.total).toBe(3);
    expect(firstPage.body.page).toBe(1);
    expect(firstPage.body.items[0].id).toBe(plannedTop.id);
    expect(firstPage.body.items[0].voteCount).toBe(2);
    expect(firstPage.body.items[0].hasVoted).toBe(true);

    const secondPage = await request(app)
      .get("/api/features")
      .set("Cookie", author.cookie)
      .query({
        q: "atlas",
        status: "PLANNED",
        sort: "votes",
        page: 2,
        pageSize: 1,
      });
    expect(secondPage.body.total).toBe(3);
    expect(secondPage.body.items[0].id).toBe(
      [plannedNext.id, zeroVoteTie.id].sort()[0],
    );
    const thirdPage = await request(app)
      .get("/api/features")
      .set("Cookie", author.cookie)
      .query({
        q: "atlas",
        status: "PLANNED",
        sort: "votes",
        page: 3,
        pageSize: 1,
      });
    expect(thirdPage.body.items[0].id).toBe(
      [plannedNext.id, zeroVoteTie.id].sort()[1],
    );

    const newest = await request(app)
      .get("/api/features")
      .set("Cookie", author.cookie)
      .query({ q: "atlas", sort: "newest", page: 1, pageSize: 20 });
    expect(newest.body.total).toBe(4);
    expect(newest.body.items.map((item: FeatureItem) => item.id)).toEqual(
      [plannedTop.id, plannedNext.id, zeroVoteTie.id, inProgress.id].sort(),
    );

    const allStatuses = await request(app)
      .get("/api/features")
      .set("Cookie", author.cookie)
      .query({ q: "atlas", status: "" });
    expect(allStatuses.status).toBe(200);
    expect(allStatuses.body.total).toBe(4);

    const invalidStatus = await request(app)
      .get("/api/features")
      .set("Cookie", author.cookie)
      .query({ status: "UNKNOWN" });
    expect(invalidStatus.status).toBe(400);
    const invalidPageSize = await request(app)
      .get("/api/features")
      .set("Cookie", author.cookie)
      .query({ pageSize: 21 });
    expect(invalidPageSize.status).toBe(400);
  });
});
