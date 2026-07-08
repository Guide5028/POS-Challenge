import { FastifyReply, FastifyRequest } from "fastify";
import { authService } from "../services/auth.service";
import { sendError } from "../utils/response";
import { loginSchema, registerSchema } from "../schemas/auth.schemas";

export const authController = {
  login: async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) return sendError(reply, 400, parsed.error.message);

    try {
      const result = await authService.login(parsed.data.email, parsed.data.password);
      reply.send(result); // { accessToken, refreshToken, profile }
    } catch (error) {
      reply.status(401).send({ error: "Invalid credentials" });
    }
  },

  register: async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) return sendError(reply, 400, parsed.error.message);

    try {
      const { email, password, name } = parsed.data;
      const profile = await authService.register(email, password, name);
      reply.status(201).send({ message: "Employee registered successfully", profile });
    } catch (error) {
      reply.status(400).send({ error: (error as Error).message || "Registration failed" });
    }
  },

  refreshToken: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { refreshToken } = request.body as { refreshToken: string };
      const newAccessToken = await authService.refreshToken(refreshToken);
      reply.send({ accessToken: newAccessToken });
    } catch (error) {
      reply.status(401).send({ error: "Invalid refresh token" });
    }
  },

  logout: async (request: FastifyRequest, reply: FastifyReply) => {
    // For stateless JWT, logout is typically handled on the client side by deleting the token.
    // If you want to implement server-side token invalidation, you would need to maintain a blacklist of tokens.
    reply.send({ message: "Logged out successfully" });
  },

  getProfile: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // request.user is set by the authenticate preHandler — this route
      // only runs if that already succeeded.
      const profile = await authService.getProfile(request.user!.userId);
      reply.send(profile);
    } catch (error) {
      reply.status(404).send({ error: (error as Error).message });
    }
  },
};