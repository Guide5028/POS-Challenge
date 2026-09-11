import { FastifyReply, FastifyRequest } from "fastify";
import { customerService } from "../services/customer.service";
import { sendSuccess, sendError } from "../utils/response";
import {
  registerCustomerSchema,
  loginCustomerSchema,
  updateCustomerSchema,
} from "../schemas/customer.schemas";

function parseId(request: FastifyRequest, reply: FastifyReply): number | null {
  const id = Number((request.params as { id: string }).id);
  if (Number.isNaN(id)) {
    sendError(reply, 400, "Invalid customer id — must be a number");
    return null;
  }
  return id;
}

export const customerController = {
  register: async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = registerCustomerSchema.safeParse(request.body);
    if (!parsed.success) return sendError(reply, 400, parsed.error.message);

    try {
      const { email, password, name } = parsed.data;
      const profile = await customerService.register(email, password, name);
      return sendSuccess(reply, profile, 201);
    } catch (error) {
      return sendError(reply, 400, (error as Error).message || "Registration failed");
    }
  },

  login: async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = loginCustomerSchema.safeParse(request.body);
    if (!parsed.success) return sendError(reply, 400, parsed.error.message);

    try {
      const result = await customerService.login(parsed.data.email, parsed.data.password);
      return sendSuccess(reply, result);
    } catch (error) {
      return sendError(reply, 401, (error as Error).message || "Wrong email or password");
    }
  },

  getProfile: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const profile = await customerService.getProfile(request.user!.userId);
      return sendSuccess(reply, profile);
    } catch (error) {
      return sendError(reply, 404, (error as Error).message);
    }
  },

  getAllCustomers: async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const customers = await customerService.getAllCustomers();
      return sendSuccess(reply, customers);
    } catch (error) {
      return sendError(reply, 500, "Failed to fetch customers");
    }
  },

  updateCustomer: async (request: FastifyRequest, reply: FastifyReply) => {
    const id = parseId(request, reply);
    if (id === null) return;

    const parsed = updateCustomerSchema.safeParse(request.body);
    if (!parsed.success) return sendError(reply, 400, parsed.error.message);

    try {
      const updated = await customerService.updateCustomer(id, parsed.data);
      return sendSuccess(reply, updated);
    } catch (error) {
      return sendError(reply, 404, (error as Error).message);
    }
  },
};
