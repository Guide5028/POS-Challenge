import { FastifyInstance } from "fastify";
import { refundController } from "../controllers/refund.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const refundRoutes = (app: FastifyInstance) => {
  app.post("/", { preHandler: [authenticate] }, refundController.createRefund);
  app.get(
    "/",
    { preHandler: [authenticate, requireRole(["admin"])] },
    refundController.getAllRefunds,
  );
};

export default refundRoutes;
