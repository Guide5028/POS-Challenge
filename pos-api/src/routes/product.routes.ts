import { FastifyInstance } from "fastify";
import { productController } from "../controllers/product.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const productRoutes = (app: FastifyInstance) => {
  // Browsing products: any logged-in employee — cashier or admin.
  app.get("/", { preHandler: [authenticate] }, productController.getAllProducts);
  app.get("/:id", { preHandler: [authenticate] }, productController.getProductById);

  // Changing the catalog: admin only. Two hooks run in order — authenticate
  // first (fills in request.user), then requireRole checks it. If
  // authenticate fails, it already replied 401 and returned, so
  // requireRole never runs.
  app.post("/", { preHandler: [authenticate, requireRole(["admin"])] }, productController.createProduct);
  app.put("/:id", { preHandler: [authenticate, requireRole(["admin"])] }, productController.updateProduct);
  app.delete("/:id", { preHandler: [authenticate, requireRole(["admin"])] }, productController.deleteProduct);
  app.patch(
    "/:id/stock",
    { preHandler: [authenticate, requireRole(["admin"])] },
    productController.updateStock
  );
};

export default productRoutes;