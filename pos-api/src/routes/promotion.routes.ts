import { FastifyInstance } from "fastify";
import { promotionController } from "../controllers/promotion.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

// public reads (same as /products) -- the storefront shows active promos/prices to
// anonymous shoppers browsing the shop and checkout pages, before they ever log in;
// only admins can create/edit/delete
const promotionRoutes = (app: FastifyInstance) => {
  app.get("/", promotionController.getAllPromotions);
  app.get("/:id", promotionController.getPromotionById);
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
