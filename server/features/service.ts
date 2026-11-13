import type { Prisma } from "../../generated/prisma/client.js";
import type {
  AdminSummaryResponse,
  FeatureCard,
  FeatureListResponse,
} from "../../shared/contracts.js";
import type { FeatureStatus } from "../../shared/contracts.js";
import { prisma } from "../db/prisma.js";
import { HttpError } from "../http/errors.js";

function featureDetailsForUser(viewerId: string) {
  return {
    author: { select: { id: true, name: true } },
    _count: { select: { votes: true } },
    votes: { where: { userId: viewerId }, select: { id: true } },
  } satisfies Prisma.FeatureInclude;
}

type FeatureDetails = Prisma.FeatureGetPayload<{
  include: ReturnType<typeof featureDetailsForUser>;
}>;

type FeatureListOptions = {
  q: string;
  status?: FeatureStatus | undefined;
  sortBy: "createdAt" | "title" | "votes";
  sortOrder: "asc" | "desc";
  page: number;
  pageSize: number;
};

function featureCard(feature: FeatureDetails): FeatureCard {
  return {
    id: feature.id,
    title: feature.title,
    author: feature.author,
    votes: feature._count.votes,
    status: feature.status,
    createdAt: feature.createdAt.toISOString(),
    updatedAt: feature.updatedAt.toISOString(),
    hasVotedByMe: feature.votes.length > 0,
  };
}

function featureOrderBy(
  sortBy: FeatureListOptions["sortBy"],
  sortOrder: "asc" | "desc",
): Prisma.FeatureOrderByWithRelationInput[] {
  if (sortBy === "title") return [{ title: sortOrder }, { id: "asc" }];
  if (sortBy === "votes")
    return [{ votes: { _count: sortOrder } }, { id: "asc" }];
  return [{ createdAt: sortOrder }, { id: "asc" }];
}

export async function listFeatures(
  options: FeatureListOptions,
  viewerId: string,
): Promise<FeatureListResponse> {
  const where: Prisma.FeatureWhereInput = {
    ...(options.q
      ? { title: { contains: options.q, mode: "insensitive" } }
      : {}),
    ...(options.status ? { status: options.status } : {}),
  };
  const [features, total] = await Promise.all([
    prisma.feature.findMany({
      where,
      orderBy: featureOrderBy(options.sortBy, options.sortOrder),
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize,
      include: featureDetailsForUser(viewerId),
    }),
    prisma.feature.count({ where }),
  ]);

  return {
    items: features.map(featureCard),
    total,
    page: options.page,
    pageSize: options.pageSize,
    pageCount: Math.ceil(total / options.pageSize),
  };
}

export async function createFeature(
  title: string,
  authorId: string,
): Promise<FeatureCard> {
  const feature = await prisma.feature.create({
    data: { title, authorId },
    include: featureDetailsForUser(authorId),
  });
  return featureCard(feature);
}

export async function getFeature(
  id: string,
  viewerId: string,
): Promise<FeatureCard> {
  const feature = await prisma.feature.findUnique({
    where: { id },
    include: featureDetailsForUser(viewerId),
  });
  if (!feature)
    throw new HttpError(
      404,
      "FEATURE_NOT_FOUND",
      "This request no longer exists.",
    );
  return featureCard(feature);
}

export async function castVote(
  featureId: string,
  userId: string,
): Promise<FeatureCard> {
  const feature = await prisma.feature.findUnique({
    where: { id: featureId },
    select: { id: true, authorId: true },
  });
  if (!feature)
    throw new HttpError(
      404,
      "FEATURE_NOT_FOUND",
      "This request no longer exists.",
    );
  if (feature.authorId === userId) {
    throw new HttpError(
      403,
      "OWN_FEATURE_VOTE",
      "You cannot vote on your own request.",
    );
  }

  try {
    await prisma.vote.create({ data: { featureId, userId } });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new HttpError(
        409,
        "ALREADY_VOTED",
        "You have already voted for this request.",
      );
    }
    throw error;
  }

  return getFeature(featureId, userId);
}

export async function updateFeatureStatus(
  id: string,
  status: FeatureStatus,
  viewerId: string,
): Promise<FeatureCard> {
  try {
    const feature = await prisma.feature.update({
      where: { id },
      data: { status },
      include: featureDetailsForUser(viewerId),
    });
    return featureCard(feature);
  } catch (error) {
    if (isMissingRecordError(error)) {
      throw new HttpError(
        404,
        "FEATURE_NOT_FOUND",
        "This request no longer exists.",
      );
    }
    throw error;
  }
}

export async function getAdminSummary(): Promise<AdminSummaryResponse> {
  const counts = await prisma.feature.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const countByStatus = new Map(
    counts.map((entry) => [entry.status, entry._count._all]),
  );
  const planned = countByStatus.get("PLANNED") ?? 0;
  const inProgress = countByStatus.get("IN_PROGRESS") ?? 0;
  const shipped = countByStatus.get("SHIPPED") ?? 0;

  return {
    total: planned + inProgress + shipped,
    planned,
    inProgress,
    shipped,
  };
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "P2002";
}

function isMissingRecordError(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "P2025";
}
