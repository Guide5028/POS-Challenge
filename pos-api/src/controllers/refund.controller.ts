import { FastifyReply, FastifyRequest } from "fastify";
import { refundService } from "../services/refund.service";
import { sendSuccess, sendError } from "../utils/response";
import { createRefundSchema } from "../schemas/refund.schemas";

const createRefund = async (request: FastifyRequest, reply: FastifyReply) => {
  const parsed = createRefundSchema.safeParse(request.body);
  if (!parsed.success) return sendError(reply, 400, parsed.error.message);

  try {
    const { saleItemId, quantity, reason, employeeId } = parsed.data;
    const refund = await refundService.createRefund(
      saleItemId,
      quantity,
      reason,
      employeeId,
    );
    return sendSuccess(reply, refund, 201);
  } catch (error) {
    return sendError(reply, 400, (error as Error).message);
  }
};

const getAllRefunds = async (_request: FastifyRequest, reply: FastifyReply) => {
  try {
    const refunds = await refundService.getAllRefunds();
    return sendSuccess(reply, refunds);
  } catch (error) {
    return sendError(reply, 500, "Failed to fetch refunds");
  }
};

export const refundController = {
  createRefund,
  getAllRefunds,
};
