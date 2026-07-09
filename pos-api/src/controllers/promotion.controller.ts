import { FastifyReply, FastifyRequest } from "fastify";
import { promotionService } from "../services/promotion.service";
import { sendSuccess, sendError } from "../utils/response";
import {
  createPromotionSchema,
  updatePromotionSchema,
  listPromotionsQuerySchema,
} from "../schemas/promotion.schemas";

function parseId(request: FastifyRequest, reply: FastifyReply): number | null {
  const id = Number((request.params as { id: string }).id);
  if (Number.isNaN(id)) {
    sendError(reply, 400, "Invalid promotion id — must be a number");
    return null;
  }
  return id;
}

export const promotionController = {
  getAllPromotions: async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = listPromotionsQuerySchema.safeParse(request.query);
    if (!parsed.success) return sendError(reply, 400, parsed.error.message);

    try {
      const promotions = await promotionService.getAllPromotions(parsed.data.activeOnly);
      return sendSuccess(reply, promotions);
    } catch (error) {
      return sendError(reply, 500, "Failed to fetch promotions");
    }
  },

  getPromotionById: async (request: FastifyRequest, reply: FastifyReply) => {
    const id = parseId(request, reply);
    if (id === null) return;

    try {
      const found = await promotionService.getPromotionById(id);
      return sendSuccess(reply, found);
    } catch (error) {
      return sendError(reply, 404, (error as Error).message);
    }
  },

  createPromotion: async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = createPromotionSchema.safeParse(request.body);
    if (!parsed.success) return sendError(reply, 400, parsed.error.message);

    try {
      const created = await promotionService.createPromotion(parsed.data);
      return sendSuccess(reply, created, 201);
    } catch (error) {
      return sendError(reply, 400, (error as Error).message);
    }
  },

  updatePromotion: async (request: FastifyRequest, reply: FastifyReply) => {
    const id = parseId(request, reply);
    if (id === null) return;

    const parsed = updatePromotionSchema.safeParse(request.body);
    if (!parsed.success) return sendError(reply, 400, parsed.error.message);

    try {
      const updated = await promotionService.updatePromotion(id, parsed.data);
      return sendSuccess(reply, updated);
    } catch (error) {
      return sendError(reply, 404, (error as Error).message);
    }
  },

  deletePromotion: async (request: FastifyRequest, reply: FastifyReply) => {
    const id = parseId(request, reply);
    if (id === null) return;

    try {
      await promotionService.deletePromotion(id);
      return sendSuccess(reply, { message: "Promotion deleted successfully" });
    } catch (error) {
      return sendError(reply, 404, (error as Error).message);
    }
  },
};
