import { FastifyInstance } from "fastify";
import { promotionController } from "../controllers/promotion.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

// same split as products — anyone logged in can browse, only admins can edit
const promotionRoutes = (app: FastifyInstance) => {
  app.get(
    "/",
    { preHandler: [authenticate] },
    promotionController.getAllPromotions,
  );
  app.get(
    "/:id",
    { preHandler: [authenticate] },
    promotionController.getPromotionById,
  );
  app.post(
    "/",
    { preHandler: [authenticate, requireRole(["admin"])] },
    promotionController.createPromotion,
  );
  app.put(
    "/:id",
    { preHandler: [authenticate, requireRole(["admin"])] },
    promotionController.updatePromotion,
  );
  app.delete(
    "/:id",
    { preHandler: [authenticate, requireRole(["admin"])] },
    promotionController.deletePromotion,
  );
};

export default promotionRoutes;
