import { FastifyInstance } from "fastify";
import { authController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const authRoutes = (app: FastifyInstance) => {
  app.post("/login", authController.login);
  app.post("/register", authController.register);
  app.post("/refresh", authController.refreshToken);
  app.post("/logout", { preHandler: [authenticate] }, authController.logout);
  app.get(
    "/profile",
    { preHandler: [authenticate] },
    authController.getProfile,
  );
  app.put(
    "/profile",
    { preHandler: [authenticate] },
    authController.updateProfile,
  );
};

export default authRoutes;
