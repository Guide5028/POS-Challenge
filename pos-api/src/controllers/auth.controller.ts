import { FastifyReply, FastifyRequest } from "fastify";
import { authService } from "../services/auth.service";
import { sendSuccess, sendError } from "../utils/response";
import { loginSchema, registerSchema } from "../schemas/auth.schemas";

export const authController = {
  login: async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) return sendError(reply, 400, parsed.error.message);

    try {
      const result = await authService.login(
        parsed.data.email,
        parsed.data.password,
      );
      return sendSuccess(reply, result); // data: { accessToken, refreshToken, profile }
    } catch (error) {
      return sendError(reply, 401, "Wrong email or password");
    }
  },

  register: async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) return sendError(reply, 400, parsed.error.message);

    try {
      const { email, password, name } = parsed.data;
      const profile = await authService.register(email, password, name);
      return sendSuccess(reply, profile, 201);
    } catch (error) {
      return sendError(reply, 400, (error as Error).message || "Registration failed");
    }
  },

  refreshToken: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { refreshToken } = request.body as { refreshToken: string };
      const newAccessToken = await authService.refreshToken(refreshToken);
      return sendSuccess(reply, { accessToken: newAccessToken });
    } catch (error) {
      return sendError(reply, 401, "Invalid refresh token");
    }
  },

  logout: async (request: FastifyRequest, reply: FastifyReply) => {
    // For stateless JWT, logout is typically handled on the client side by deleting the token.
    // If you want to implement server-side token invalidation, you would need to maintain a blacklist of tokens.
    return sendSuccess(reply, { message: "Logged out successfully" });
  },

  getProfile: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // request.user is set by the authenticate preHandler — this route
      // only runs if that already succeeded.
      const profile = await authService.getProfile(request.user!.userId);
      return sendSuccess(reply, profile);
    } catch (error) {
      return sendError(reply, 404, (error as Error).message);
    }
  },
};
