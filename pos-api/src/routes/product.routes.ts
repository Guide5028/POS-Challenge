import { FastifyInstance } from "fastify";
import { productController } from "../controllers/product.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const productRoutes = (app: FastifyInstance) => {
  app.get(
    "/",
    { preHandler: [authenticate] },
    productController.getAllProducts,
  );
  app.get(
    "/:id",
    { preHandler: [authenticate] },
    productController.getProductById,
  );
  // scanner-friendly lookup — exact barcode match, used at checkout
  app.get(
    "/barcode/:barcode",
    { preHandler: [authenticate] },
    productController.getProductByBarcode,
  );
  app.post(
    "/",
    { preHandler: [authenticate, requireRole(["admin"])] },
    productController.createProduct,
  );
  app.put(
    "/:id",
    { preHandler: [authenticate, requireRole(["admin"])] },
    productController.updateProduct,
  );
  app.delete(
    "/:id",
    { preHandler: [authenticate, requireRole(["admin"])] },
    productController.deleteProduct,
  );
  app.patch(
    "/:id/stock",
    { preHandler: [authenticate, requireRole(["admin"])] },
    productController.updateStock,
  );
  app.post(
    "/:id/image",
    { preHandler: [authenticate, requireRole(["admin"])] },
    productController.uploadImage,
  );
};

export default productRoutes;
