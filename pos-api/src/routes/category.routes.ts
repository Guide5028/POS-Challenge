import { FastifyInstance } from "fastify";
import { categoryController } from "../controllers/category.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

// same split as products/promotions — anyone logged in can browse, only admins can edit
const categoryRoutes = (app: FastifyInstance) => {
  app.get(
    "/",
    { preHandler: [authenticate] },
    categoryController.getAllCategories,
  );
  app.get(
    "/:id",
    { preHandler: [authenticate] },
    categoryController.getCategoryById,
  );
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
