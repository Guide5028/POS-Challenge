import { FastifyReply, FastifyRequest } from "fastify";
import { saleService } from "../services/sale.service";
import { sendSuccess, sendError } from "../utils/response";
import { createSaleSchema } from "../schemas/sale.schemas";

export const saleController = {
  createSale: async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = createSaleSchema.safeParse(request.body);
    if (!parsed.success) return sendError(reply, 400, parsed.error.message);

    try {
      const sale = await saleService.createSale(parsed.data);
      return sendSuccess(reply, sale, 201);
    } catch (error) {
      return sendError(reply, 400, (error as Error).message);
    }
  },

  getAllSales: async (_request: FastifyRequest, reply: FastifyReply) => {
    const sales = await saleService.getAllSales();
    return sendSuccess(reply, sales);
  },

  getSaleById: async (request: FastifyRequest, reply: FastifyReply) => {
    const id = Number((request.params as { id: string }).id);
    try {
      const found = await saleService.getSaleById(id);
      return sendSuccess(reply, found);
    } catch (error) {
      return sendError(reply, 404, (error as Error).message);
    }
  },
};
