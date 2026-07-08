import { FastifyInstance } from "fastify";
import { saleController } from "../controllers/sale.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

// "Buy product" is POST /, "Selling list history" is GET /,
// "Selling detail history" is GET /:id.
const saleRoutes = (app: FastifyInstance) => {
  app.post("/", { preHandler: [authenticate] }, saleController.createSale);
  app.get("/", { preHandler: [authenticate, requireRole(["admin"])] }, saleController.getAllSales);
  app.get("/:id", { preHandler: [authenticate, requireRole(["admin"])] }, saleController.getSaleById);
};

export default saleRoutes;
