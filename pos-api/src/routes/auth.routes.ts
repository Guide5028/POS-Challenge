import { FastifyInstance } from "fastify";
import { authController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const authRoutes = (app: FastifyInstance) => {
  app.post("/login", authController.login);
  app.post("/register", authController.register);
  app.post("/refresh", authController.refreshToken);

  // Logout and profile both require a valid token — you have to be
  // logged in to log out or to see your own profile.
  app.post("/logout", { preHandler: [authenticate] }, authController.logout);
  app.get("/profile", { preHandler: [authenticate] }, authController.getProfile);
};

export default authRoutes;