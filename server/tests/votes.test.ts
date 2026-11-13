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

describe("feature voting API", () => {
  it("allows self-votes and concurrent idempotent votes, then removes votes idempotently", async () => {
    const author = await createAccount("Alex Kim");
    const voter = await createAccount("Riley Chen");
    const feature = await createFeature(author.cookie, "Saved board views");

    const concurrentVotes = await Promise.all(
      Array.from({ length: 8 }, () =>
        request(app)
          .put(`/api/features/${feature.id}/vote`)
          .set("Cookie", voter.cookie),
      ),
    );
    expect(concurrentVotes.every((response) => response.status === 200)).toBe(
      true,
    );
    expect(concurrentVotes.at(-1)?.body).toMatchObject({
      featureId: feature.id,
      voteCount: 1,
      hasVoted: true,
    });
    expect(await prisma.vote.count({ where: { featureId: feature.id } })).toBe(
      1,
    );

    const selfVote = await request(app)
      .put(`/api/features/${feature.id}/vote`)
      .set("Cookie", author.cookie);
    expect(selfVote.body).toMatchObject({ voteCount: 2, hasVoted: true });

    const login = await request(app).post("/api/auth/login").send({
      email: voter.email,
      password: voter.password,
    });
    const newSession = login.headers["set-cookie"]?.[0]?.split(";")[0];
    const afterLogin = await request(app)
      .get("/api/features")
      .set("Cookie", newSession ?? "");
    expect(
      afterLogin.body.items.find((item: FeatureItem) => item.id === feature.id)
        .hasVoted,
    ).toBe(true);

    const removed = await request(app)
      .delete(`/api/features/${feature.id}/vote`)
      .set("Cookie", voter.cookie);
    expect(removed.status).toBe(200);
    expect(removed.body).toMatchObject({ voteCount: 1, hasVoted: false });

    const repeatedRemoval = await request(app)
      .delete(`/api/features/${feature.id}/vote`)
      .set("Cookie", voter.cookie);
    expect(repeatedRemoval.status).toBe(200);
    expect(repeatedRemoval.body).toMatchObject({
      voteCount: 1,
      hasVoted: false,
    });
  });

  it("requires authentication and returns 404 for missing features", async () => {
    const anonymousList = await request(app).get("/api/features");
    const anonymousCreate = await request(app).post("/api/features").send({});
    const anonymousVote = await request(app).put(
      "/api/features/90000000-0000-4000-8000-000000000001/vote",
    );
    const anonymousRemoval = await request(app).delete(
      "/api/features/90000000-0000-4000-8000-000000000001/vote",
    );

    expect(anonymousList.status).toBe(401);
    expect(anonymousCreate.status).toBe(401);
    expect(anonymousVote.status).toBe(401);
    expect(anonymousRemoval.status).toBe(401);

    const user = await createAccount("Casey Park");
    const invalidId = await request(app)
      .put("/api/features/not-a-uuid/vote")
      .set("Cookie", user.cookie);
    expect(invalidId.status).toBe(400);

    for (const method of ["put", "delete"] as const) {
      const response = await request(app)
        [method]("/api/features/90000000-0000-4000-8000-000000000001/vote")
        .set("Cookie", user.cookie);
      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("NOT_FOUND");
    }
  });
});
