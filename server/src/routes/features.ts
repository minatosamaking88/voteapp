import { Router } from "express";
import {
  featureIdSchema,
  featureInputSchema,
  featureListQuerySchema,
} from "@featurevote/shared/contracts";
import { parseInput } from "../api-error.js";
import { assertSameOrigin } from "../auth.js";
import {
  addFeatureVote,
  createFeature,
  listFeatures,
  removeFeatureVote,
} from "../lib/features.js";

const router = Router();
router.use(assertSameOrigin);

router.get("/", async (request, response) => {
  const query = parseInput(featureListQuerySchema, request.query);
  const result = await listFeatures(
    query,
    response.locals.authenticatedUser.id,
  );
  response.json(result);
});

router.post("/", async (request, response) => {
  const input = parseInput(featureInputSchema, request.body);
  const feature = await createFeature(
    input,
    response.locals.authenticatedUser.id,
  );
  response.status(201).json(feature);
});

router.put("/:id/vote", async (request, response) => {
  const featureId = parseInput(featureIdSchema, request.params.id);
  const result = await addFeatureVote(
    featureId,
    response.locals.authenticatedUser.id,
  );
  response.json(result);
});

router.delete("/:id/vote", async (request, response) => {
  const featureId = parseInput(featureIdSchema, request.params.id);
  const result = await removeFeatureVote(
    featureId,
    response.locals.authenticatedUser.id,
  );
  response.json(result);
});

export default router;
