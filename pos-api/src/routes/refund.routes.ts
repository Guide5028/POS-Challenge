import { FastifyInstance } from "fastify";
import { refundController } from "../controllers/refund.controller";
import { authenticate } from "../middleware/auth.middleware";

const refundRoutes = (app: FastifyInstance) => {
  app.post("/", { preHandler: [authenticate] }, refundController.createRefund);
};

export default refundRoutes;