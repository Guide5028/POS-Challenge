// TODO: block request unless request.user.role matches an allowed role
import { preHandlerHookHandler } from "fastify";
import { sendError } from "../utils/response";

export function requireRole(allowedRoles: string[]): preHandlerHookHandler {
  return async (req, reply) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return sendError(reply, 403, "Forbidden: Insufficient role");
    }
  };
}
