import { Router } from "express";
import {
  createFeatureSchema,
  featureIdParamsSchema,
  featureListQuerySchema,
} from "../../shared/contracts.js";
import { getAuthenticatedUser, requireAuth } from "../auth/middleware.js";
import { sendValidationError } from "../http/errors.js";
import {
  castVote,
  createFeature,
  getFeature,
  listFeatures,
} from "./service.js";

export const featureRouter = Router();

featureRouter.use(requireAuth);

featureRouter.get("/", async (request, response) => {
  const parsed = featureListQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    sendValidationError(response, parsed.error);
    return;
  }

  response.json(
    await listFeatures(parsed.data, getAuthenticatedUser(request).id),
  );
});

featureRouter.post("/", async (request, response, next) => {
  const parsed = createFeatureSchema.safeParse(request.body);
  if (!parsed.success) {
    sendValidationError(response, parsed.error);
    return;
  }

  try {
    response
      .status(201)
      .json(
        await createFeature(
          parsed.data.title,
          getAuthenticatedUser(request).id,
        ),
      );
  } catch (error) {
    next(error);
  }
});

featureRouter.post("/:id/votes", async (request, response, next) => {
  const parsed = featureIdParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    sendValidationError(response, parsed.error);
    return;
  }

  try {
    response.json(
      await castVote(parsed.data.id, getAuthenticatedUser(request).id),
    );
  } catch (error) {
    next(error);
  }
});

featureRouter.get("/:id", async (request, response, next) => {
  const parsed = featureIdParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    sendValidationError(response, parsed.error);
    return;
  }

  try {
    response.json(
      await getFeature(parsed.data.id, getAuthenticatedUser(request).id),
    );
  } catch (error) {
    next(error);
  }
});
