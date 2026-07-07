// TODO: auth route definitions (paths -> controller functions)
import { FastifyInstance } from "fastify";
import { authController } from "../controllers/auth.controller";

const authRoutes = (app: FastifyInstance) => {
  app.post("/login", authController.login);
  app.post("/register", authController.register);
};

export default authRoutes;