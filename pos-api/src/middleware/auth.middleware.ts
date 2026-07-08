import { preHandlerHookHandler } from "fastify";
import { verifyAccessToken } from "../utils/jwt";
import { sendError } from "../utils/response";

export const authenticate: preHandlerHookHandler = async (req, reply) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendError(reply, 401, "Missing or invalid Authorization header");
  } 

  const token = authHeader.split(" ")[1];

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    return sendError(reply, 401, "Invalid or expired token");
  }

  req.user = payload;
};