import { FastifyInstance } from "fastify";
import { customerController } from "../controllers/customer.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

// Separate from employee auth entirely -- shoppers register/log in here and get a
// "customer" role token, which never satisfies requireRole(["admin"]) / (["cashier"])
// on staff-only routes. Admin-only endpoints below reuse the same authenticate
// middleware but require an employee's "admin" role, same pattern as employee.routes.
const customerRoutes = (app: FastifyInstance) => {
  app.post("/register", customerController.register);
  app.post("/login", customerController.login);
  app.get("/profile", { preHandler: [authenticate] }, customerController.getProfile);

  app.get(
    "/",
    { preHandler: [authenticate, requireRole(["admin"])] },
    customerController.getAllCustomers,
  );
  app.patch(
    "/:id",
    { preHandler: [authenticate, requireRole(["admin"])] },
    customerController.updateCustomer,
  );
};

export default customerRoutes;
