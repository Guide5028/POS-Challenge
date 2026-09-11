import { FastifyInstance } from "fastify";
import { categoryController } from "../controllers/category.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

// public reads (same as /products) -- the storefront needs category names for
// anonymous shoppers (shop filters, promotion previews) before they ever log in;
// only admins can create/edit/delete
const categoryRoutes = (app: FastifyInstance) => {
  app.get("/", categoryController.getAllCategories);
  app.get("/:id", categoryController.getCategoryById);
  app.post(
    "/",
    { preHandler: [authenticate, requireRole(["admin"])] },
    categoryController.createCategory,
  );
  app.put(
    "/:id",
    { preHandler: [authenticate, requireRole(["admin"])] },
    categoryController.updateCategory,
  );
  app.delete(
    "/:id",
    { preHandler: [authenticate, requireRole(["admin"])] },
    categoryController.deleteCategory,
  );
};

export default categoryRoutes;
