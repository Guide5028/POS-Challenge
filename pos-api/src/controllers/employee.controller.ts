import { FastifyReply, FastifyRequest } from "fastify";
import { employeeService } from "../services/employee.service";
import { sendSuccess, sendError } from "../utils/response";
import { updateEmployeeSchema } from "../schemas/employee.schemas";

function parseId(request: FastifyRequest, reply: FastifyReply): number | null {
  const id = Number((request.params as { id: string }).id);
  if (Number.isNaN(id)) {
    sendError(reply, 400, "Invalid employee id — must be a number");
    return null;
  }
  return id;
}

export const employeeController = {
  getAllEmployees: async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const employees = await employeeService.getAllEmployees();
      return sendSuccess(reply, employees);
    } catch (error) {
      return sendError(reply, 500, "Failed to fetch employees");
    }
  },

  updateEmployee: async (request: FastifyRequest, reply: FastifyReply) => {
    const id = parseId(request, reply);
    if (id === null) return;

    // an admin can't change their own isActive/role here — avoids locking
    // themselves out with no other admin around to undo it
    if (id === request.user!.userId) {
      return sendError(reply, 400, "You can't change your own access level");
    }

    const parsed = updateEmployeeSchema.safeParse(request.body);
    if (!parsed.success) return sendError(reply, 400, parsed.error.message);

    try {
      const updated = await employeeService.updateEmployee(id, parsed.data);
      return sendSuccess(reply, updated);
    } catch (error) {
      return sendError(reply, 404, (error as Error).message);
    }
  },
};
