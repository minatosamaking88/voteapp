import type {
  FeatureInput,
  FeatureItem,
  FeatureListQuery,
  FeatureListResponse,
  VoteResponse,
} from "@featurevote/shared/contracts";
import { Prisma } from "../generated/prisma/client.js";
import { ApiError } from "../api-error.js";
import { prisma } from "../db.js";

export async function listFeatures(
  query: FeatureListQuery,
  currentUserId: string,
): Promise<FeatureListResponse> {
  const where: Prisma.FeatureWhereInput = {};
  if (query.status) where.status = query.status;
  if (query.q) where.title = { contains: query.q, mode: "insensitive" };

  const orderBy: Prisma.FeatureOrderByWithRelationInput[] =
    query.sort === "votes"
      ? [{ votes: { _count: "desc" } }, { createdAt: "desc" }, { id: "asc" }]
      : [{ createdAt: "desc" }, { id: "asc" }];

  const [features, total] = await Promise.all([
    prisma.feature.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { id: true, name: true } },
        _count: { select: { votes: true } },
        votes: { where: { userId: currentUserId }, select: { id: true } },
      },
    }),
    prisma.feature.count({ where }),
  ]);

  return {
    items: features.map((feature) => ({
      id: feature.id,
      title: feature.title,
      description: feature.description,
      status: feature.status,
      author: feature.author,
      voteCount: feature._count.votes,
      hasVoted: feature.votes.length > 0,
      createdAt: feature.createdAt.toISOString(),
      updatedAt: feature.updatedAt.toISOString(),
    })),
    page: query.page,
    pageSize: query.pageSize,
    total,
  };
}

export async function createFeature(
  input: FeatureInput,
  authorId: string,
): Promise<FeatureItem> {
  const feature = await prisma.feature.create({
    data: { ...input, status: "PLANNED", authorId },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      author: { select: { id: true, name: true } },
    },
  });

  return {
    ...feature,
    createdAt: feature.createdAt.toISOString(),
    updatedAt: feature.updatedAt.toISOString(),
    voteCount: 0,
    hasVoted: false,
  };
}

export async function addFeatureVote(
  featureId: string,
  userId: string,
): Promise<VoteResponse> {
  await ensureFeatureExists(featureId);
  await prisma.vote.createMany({
    data: [{ userId, featureId }],
    skipDuplicates: true,
  });
  return readVoteState(featureId, userId);
}

export async function removeFeatureVote(
  featureId: string,
  userId: string,
): Promise<VoteResponse> {
  await ensureFeatureExists(featureId);
  await prisma.vote.deleteMany({ where: { userId, featureId } });
  return readVoteState(featureId, userId);
}

async function ensureFeatureExists(featureId: string): Promise<void> {
  const feature = await prisma.feature.findUnique({
    where: { id: featureId },
    select: { id: true },
  });
  if (!feature) throw new ApiError(404, "NOT_FOUND", "Feature not found.");
}

async function readVoteState(
  featureId: string,
  userId: string,
): Promise<VoteResponse> {
  const [voteCount, vote] = await Promise.all([
    prisma.vote.count({ where: { featureId } }),
    prisma.vote.findUnique({
      where: { userId_featureId: { userId, featureId } },
      select: { id: true },
    }),
  ]);
  return { featureId, voteCount, hasVoted: vote !== null };
}
