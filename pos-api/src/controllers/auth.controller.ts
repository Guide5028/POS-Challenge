// TODO: auth controller — parses request, calls auth.service, shapes response
import {FastifyReply, FastifyRequest} from "fastify";
import { authService } from "../services/auth.service";

export const authController = {
  login: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email, password } = request.body as { email: string; password: string };
      const result = await authService.login(email, password);
      reply.send(result); // { accessToken, refreshToken, profile }
    } catch (error) {
      reply.status(401).send({ error: "Invalid credentials" });
    }
  },

  register: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email, password, name } = request.body as {
        email: string;
        password: string;
        name: string;
      };
      const profile = await authService.register(email, password, name);
      reply.status(201).send({ message: "Employee registered successfully", profile });
    } catch (error) {
      reply.status(400).send({ error: (error as Error).message || "Registration failed" });
    }
  },
};