import { Router } from "express";
import {
  statusUpdateBodySchema,
  statusUpdateParamsSchema,
} from "../../shared/contracts.js";
import {
  getAuthenticatedUser,
  requireAdmin,
  requireAuth,
} from "../auth/middleware.js";
import { sendValidationError } from "../http/errors.js";
import { getAdminSummary, updateFeatureStatus } from "../features/service.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/summary", async (_request, response) => {
  response.json(await getAdminSummary());
});

adminRouter.patch("/features/:id/status", async (request, response, next) => {
  const parsedParams = statusUpdateParamsSchema.safeParse(request.params);
  if (!parsedParams.success) {
    sendValidationError(response, parsedParams.error);
    return;
  }

  const parsedBody = statusUpdateBodySchema.safeParse(request.body);
  if (!parsedBody.success) {
    sendValidationError(response, parsedBody.error);
    return;
  }

  try {
    const feature = await updateFeatureStatus(
      parsedParams.data.id,
      parsedBody.data.status,
      getAuthenticatedUser(request).id,
    );
    response.json(feature);
  } catch (error) {
    next(error);
  }
});
