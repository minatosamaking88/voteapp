import { createHash } from "node:crypto";
import { Router } from "express";
import bcrypt from "bcryptjs";
import {
  loginInputSchema,
  registerInputSchema,
} from "@featurevote/shared/contracts";
import { ApiError, parseInput } from "../api-error.js";
import {
  assertSameOrigin,
  createSession,
  requireAuthentication,
  SESSION_COOKIE_NAME,
} from "../auth.js";
import { prisma } from "../db.js";

const router = Router();
const dummyPasswordHash = bcrypt.hashSync("not-a-real-password", 12);

router.get("/session", requireAuthentication, (_request, response) => {
  response.json({ user: response.locals.authenticatedUser });
});

router.post("/register", assertSameOrigin, async (request, response) => {
  const input = parseInput(registerInputSchema, request.body);
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash },
    select: { id: true, name: true, email: true },
  });

  await createSession(user.id, response);
  response.status(201).json({ user });
});

router.post("/login", assertSameOrigin, async (request, response) => {
  const input = parseInput(loginInputSchema, request.body);
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });
  const passwordMatches = await bcrypt.compare(
    input.password,
    user?.passwordHash ?? dummyPasswordHash,
  );

  if (!user || !passwordMatches) {
    throw new ApiError(
      401,
      "INVALID_CREDENTIALS",
      "Email or password is incorrect.",
    );
  }

  await createSession(user.id, response);
  response.json({
    user: { id: user.id, name: user.name, email: user.email },
  });
});

router.delete("/session", assertSameOrigin, async (request, response) => {
  const token = request.cookies?.[SESSION_COOKIE_NAME];
  if (typeof token === "string") {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await prisma.session.deleteMany({ where: { tokenHash } });
  }

  response.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
  response.status(200).json({ ok: true });
});

export default router;
