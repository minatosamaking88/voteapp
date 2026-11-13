import "dotenv/config";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  PrismaClient,
  Role,
  FeatureStatus,
} from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const seedEnvironmentSchema = z.object({
  DATABASE_URL: z.string().url(),
  DEMO_ADMIN_EMAIL: z.string().email().toLowerCase(),
  DEMO_ADMIN_PASSWORD: z
    .string()
    .min(12)
    .max(72)
    .refine((value) => new TextEncoder().encode(value).length <= 72),
  DEMO_USER_A_EMAIL: z.string().email().toLowerCase(),
  DEMO_USER_A_PASSWORD: z
    .string()
    .min(12)
    .max(72)
    .refine((value) => new TextEncoder().encode(value).length <= 72),
  DEMO_USER_B_EMAIL: z.string().email().toLowerCase(),
  DEMO_USER_B_PASSWORD: z
    .string()
    .min(12)
    .max(72)
    .refine((value) => new TextEncoder().encode(value).length <= 72),
});

const seedEnvironment = seedEnvironmentSchema.parse(process.env);
const seedEmails = [
  seedEnvironment.DEMO_ADMIN_EMAIL,
  seedEnvironment.DEMO_USER_A_EMAIL,
  seedEnvironment.DEMO_USER_B_EMAIL,
];
if (new Set(seedEmails).size !== seedEmails.length) {
  throw new Error("Demo Admin and User email addresses must be different.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: seedEnvironment.DATABASE_URL }),
});

const featureSeeds = [
  {
    id: "7c12c1b2-9ea5-4eb3-a248-b7dd04061001",
    title: "Keyboard shortcuts for common actions",
    status: FeatureStatus.PLANNED,
  },
  {
    id: "7c12c1b2-9ea5-4eb3-a248-b7dd04061002",
    title: "Export the roadmap to CSV",
    status: FeatureStatus.IN_PROGRESS,
  },
  {
    id: "7c12c1b2-9ea5-4eb3-a248-b7dd04061003",
    title: "Dark mode for the feature board",
    status: FeatureStatus.SHIPPED,
  },
  {
    id: "7c12c1b2-9ea5-4eb3-a248-b7dd04061004",
    title: "Group requests by product area",
    status: FeatureStatus.PLANNED,
  },
  {
    id: "7c12c1b2-9ea5-4eb3-a248-b7dd04061005",
    title: "Email updates when status changes",
    status: FeatureStatus.IN_PROGRESS,
  },
  {
    id: "7c12c1b2-9ea5-4eb3-a248-b7dd04061006",
    title: "Sort requests by newest activity",
    status: FeatureStatus.SHIPPED,
  },
  {
    id: "7c12c1b2-9ea5-4eb3-a248-b7dd04061007",
    title: "Show a roadmap timeline",
    status: FeatureStatus.PLANNED,
  },
  {
    id: "7c12c1b2-9ea5-4eb3-a248-b7dd04061008",
    title: "Allow comments on requests",
    status: FeatureStatus.PLANNED,
  },
  {
    id: "7c12c1b2-9ea5-4eb3-a248-b7dd04061009",
    title: "Filter requests by vote count",
    status: FeatureStatus.SHIPPED,
  },
  {
    id: "7c12c1b2-9ea5-4eb3-a248-b7dd04061010",
    title: "Notify voters about progress",
    status: FeatureStatus.IN_PROGRESS,
  },
  {
    id: "7c12c1b2-9ea5-4eb3-a248-b7dd04061011",
    title: "Pin important requests to the top",
    status: FeatureStatus.PLANNED,
  },
  {
    id: "7c12c1b2-9ea5-4eb3-a248-b7dd04061012",
    title: "Show request submission guidelines",
    status: FeatureStatus.SHIPPED,
  },
];

async function seedDemoData(): Promise<void> {
  const [adminPasswordHash, userAPasswordHash, userBPasswordHash] =
    await Promise.all([
      bcrypt.hash(seedEnvironment.DEMO_ADMIN_PASSWORD, 12),
      bcrypt.hash(seedEnvironment.DEMO_USER_A_PASSWORD, 12),
      bcrypt.hash(seedEnvironment.DEMO_USER_B_PASSWORD, 12),
    ]);
  await prisma.user.upsert({
    where: { email: seedEnvironment.DEMO_ADMIN_EMAIL },
    update: {
      name: "Board Administrator",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
    create: {
      email: seedEnvironment.DEMO_ADMIN_EMAIL,
      name: "Board Administrator",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  });
  const userA = await prisma.user.upsert({
    where: { email: seedEnvironment.DEMO_USER_A_EMAIL },
    update: {
      name: "Morgan Lee",
      passwordHash: userAPasswordHash,
      role: Role.USER,
    },
    create: {
      email: seedEnvironment.DEMO_USER_A_EMAIL,
      name: "Morgan Lee",
      passwordHash: userAPasswordHash,
      role: Role.USER,
    },
  });
  const userB = await prisma.user.upsert({
    where: { email: seedEnvironment.DEMO_USER_B_EMAIL },
    update: {
      name: "Jordan Patel",
      passwordHash: userBPasswordHash,
      role: Role.USER,
    },
    create: {
      email: seedEnvironment.DEMO_USER_B_EMAIL,
      name: "Jordan Patel",
      passwordHash: userBPasswordHash,
      role: Role.USER,
    },
  });

  for (const [index, featureSeed] of featureSeeds.entries()) {
    const author = index % 2 === 0 ? userA : userB;
    const feature = await prisma.feature.upsert({
      where: { id: featureSeed.id },
      update: { title: featureSeed.title, status: featureSeed.status },
      create: {
        id: featureSeed.id,
        title: featureSeed.title,
        status: featureSeed.status,
        authorId: author.id,
        createdAt: new Date(Date.now() - (index + 1) * 86_400_000),
      },
    });
    const voter = author.id === userA.id ? userB : userA;
    await prisma.vote.upsert({
      where: { featureId_userId: { featureId: feature.id, userId: voter.id } },
      update: {},
      create: { featureId: feature.id, userId: voter.id },
    });
  }
}

seedDemoData()
  .then(() =>
    console.info("Demo Admin, Users, feature requests, and votes are ready."),
  )
  .catch((error: unknown) => {
    console.error("Could not seed demo data.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
