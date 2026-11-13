import { randomUUID } from "node:crypto";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/db.js";

const createdUserIds: string[] = [];

afterEach(async () => {
  if (createdUserIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    createdUserIds.length = 0;
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("authentication API", () => {
  it("registers, creates a persistent session, logs in, and logs out", async () => {
    const account = {
      name: "Morgan Rivera",
      email: `${randomUUID()}@example.test`,
      password: "secure-password-123",
    };
    const registration = await request(app)
      .post("/api/auth/register")
      .send(account);

    expect(registration.status).toBe(201);
    expect(registration.body.user.name).toBe(account.name);
    createdUserIds.push(registration.body.user.id as string);
    expect(registration.headers["set-cookie"]?.[0]).toContain("HttpOnly");

    const registrationCookie =
      registration.headers["set-cookie"]?.[0]?.split(";")[0];
    expect(registrationCookie).toBeTruthy();
    const currentSession = await request(app)
      .get("/api/auth/session")
      .set("Cookie", registrationCookie ?? "");
    expect(currentSession.status).toBe(200);
    expect(currentSession.body.user.id).toBe(registration.body.user.id);

    const duplicate = await request(app)
      .post("/api/auth/register")
      .send(account);
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe("CONFLICT");

    const login = await request(app).post("/api/auth/login").send({
      email: account.email,
      password: account.password,
    });
    expect(login.status).toBe(200);
    const loginCookie = login.headers["set-cookie"]?.[0]?.split(";")[0];
    expect(loginCookie).toBeTruthy();

    const rejectedLogin = await request(app).post("/api/auth/login").send({
      email: account.email,
      password: "incorrect-password",
    });
    expect(rejectedLogin.status).toBe(401);
    expect(rejectedLogin.body.error.message).toBe(
      "Email or password is incorrect.",
    );

    const logout = await request(app)
      .delete("/api/auth/session")
      .set("Cookie", loginCookie ?? "");
    expect(logout.status).toBe(200);
    expect(logout.body.ok).toBe(true);
    const afterLogout = await request(app)
      .get("/api/auth/session")
      .set("Cookie", loginCookie ?? "");
    expect(afterLogout.status).toBe(401);
  });

  it("rejects invalid registration values and cross-origin mutations", async () => {
    const invalid = await request(app).post("/api/auth/register").send({
      name: " ",
      email: "not-an-email",
      password: "short",
    });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe("VALIDATION_ERROR");
    expect(invalid.body.error.fieldErrors).toHaveProperty("password");

    const crossOrigin = await request(app)
      .post("/api/auth/login")
      .set("Origin", "https://untrusted.example")
      .send({ email: "user@example.test", password: "not-a-real-password" });
    expect(crossOrigin.status).toBe(403);
    expect(crossOrigin.body.error.code).toBe("CROSS_SITE_REQUEST");
  });
});
