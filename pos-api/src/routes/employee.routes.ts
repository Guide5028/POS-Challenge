import { FastifyInstance } from "fastify";
import { employeeController } from "../controllers/employee.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

// admin-only — this is where pending social sign-ups get approved
const employeeRoutes = (app: FastifyInstance) => {
  app.get(
    "/",
    { preHandler: [authenticate, requireRole(["admin"])] },
    employeeController.getAllEmployees,
  );
  app.patch(
    "/:id",
    { preHandler: [authenticate, requireRole(["admin"])] },
    employeeController.updateEmployee,
  );
};

export default employeeRoutes;
