import "dotenv/config";
import bcrypt from "bcryptjs";
import {
  PASSWORD_MAX_UTF8_BYTES,
  PASSWORD_MIN_LENGTH,
} from "@featurevote/shared/contracts";
import { prisma } from "../server/src/db.js";

const demoPassword = requireDemoPassword(process.env.DEMO_USER_PASSWORD);

function requireDemoPassword(value: string | undefined): string {
  if (
    typeof value !== "string" ||
    value.length < PASSWORD_MIN_LENGTH ||
    Buffer.byteLength(value, "utf8") > PASSWORD_MAX_UTF8_BYTES
  ) {
    throw new Error(
      "Set DEMO_USER_PASSWORD to 12–72 UTF-8 bytes before seeding.",
    );
  }
  return value;
}

const seededFeatures = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    title: "Dark mode for evening planning",
    description:
      "Offer a comfortable dark theme that follows a user’s device preference.",
    status: "PLANNED" as const,
    daysAgo: 18,
    authorEmail: "avery@example.test",
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    title: "Export the roadmap to CSV",
    description:
      "Let teams export the visible roadmap and its vote totals for reports.",
    status: "PLANNED" as const,
    daysAgo: 12,
    authorEmail: "jordan@example.test",
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    title: "Keyboard shortcuts for voting",
    description:
      "Make the board faster to navigate with accessible keyboard shortcuts.",
    status: "IN_PROGRESS" as const,
    daysAgo: 8,
    authorEmail: "avery@example.test",
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    title: "Filter the board by category",
    description:
      "Group requests by product area so related ideas are easier to compare.",
    status: "IN_PROGRESS" as const,
    daysAgo: 5,
    authorEmail: "jordan@example.test",
  },
  {
    id: "10000000-0000-4000-8000-000000000005",
    title: "Show a changelog for shipped work",
    description:
      "Give voters a clear history of product improvements as they launch.",
    status: "SHIPPED" as const,
    daysAgo: 3,
    authorEmail: "avery@example.test",
  },
  {
    id: "10000000-0000-4000-8000-000000000006",
    title: "Remember the board view",
    description:
      "Keep each user’s selected sort and status filter between visits.",
    status: "SHIPPED" as const,
    daysAgo: 1,
    authorEmail: "jordan@example.test",
  },
];

async function main(): Promise<void> {
  const passwordHash = bcrypt.hashSync(demoPassword, 12);
  const demoUsers = await Promise.all([
    prisma.user.upsert({
      where: { email: "avery@example.test" },
      update: { name: "Avery Chen", passwordHash },
      create: { name: "Avery Chen", email: "avery@example.test", passwordHash },
    }),
    prisma.user.upsert({
      where: { email: "jordan@example.test" },
      update: { name: "Jordan Lee", passwordHash },
      create: {
        name: "Jordan Lee",
        email: "jordan@example.test",
        passwordHash,
      },
    }),
  ]);
  const [avery, jordan] = demoUsers;
  if (!avery || !jordan)
    throw new Error("Development seed accounts could not be created.");
  const userByEmail = new Map<string, string>([
    [avery.email, avery.id],
    [jordan.email, jordan.id],
  ]);

  for (const feature of seededFeatures) {
    const authorId = userByEmail.get(feature.authorEmail);
    if (!authorId) throw new Error(`Seed author missing for ${feature.id}.`);
    const createdAt = new Date(
      Date.now() - feature.daysAgo * 24 * 60 * 60 * 1000,
    );

    await prisma.feature.upsert({
      where: { id: feature.id },
      update: {
        title: feature.title,
        description: feature.description,
        status: feature.status,
        authorId,
        createdAt,
      },
      create: {
        id: feature.id,
        title: feature.title,
        description: feature.description,
        status: feature.status,
        authorId,
        createdAt,
      },
    });
  }

  const featureIds = seededFeatures.map((feature) => feature.id);
  const firstFeatureId = featureIds[0];
  const secondFeatureId = featureIds[1];
  const thirdFeatureId = featureIds[2];
  const fifthFeatureId = featureIds[4];
  if (
    !firstFeatureId ||
    !secondFeatureId ||
    !thirdFeatureId ||
    !fifthFeatureId
  ) {
    throw new Error("Development seed features are incomplete.");
  }

  await prisma.vote.deleteMany({ where: { featureId: { in: featureIds } } });
  await prisma.vote.createMany({
    data: [
      { userId: avery.id, featureId: firstFeatureId },
      { userId: jordan.id, featureId: firstFeatureId },
      { userId: jordan.id, featureId: secondFeatureId },
      { userId: avery.id, featureId: thirdFeatureId },
      { userId: jordan.id, featureId: fifthFeatureId },
    ],
    skipDuplicates: true,
  });
}

main()
  .catch((error: unknown) => {
    console.error("Development seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
