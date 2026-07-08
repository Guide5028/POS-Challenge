import { FastifyReply, FastifyRequest } from "fastify";
import { productService } from "../services/product.service";
import { sendSuccess, sendError } from "../utils/response";
import {
  createProductSchema,
  updateProductSchema,
  updateStockSchema,
  listProductsQuerySchema,
} from "../schemas/product.schemas";

export const productController = {
  getAllProducts: async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = listProductsQuerySchema.safeParse(request.query);
    if (!parsed.success) return sendError(reply, 400, parsed.error.message);

    try {
      const products = await productService.getAllProducts(parsed.data);
      return sendSuccess(reply, products);
    } catch (error) {
      return sendError(reply, 500, "Failed to fetch products");
    }
  },

  getProductById: async (request: FastifyRequest, reply: FastifyReply) => {
    const id = Number((request.params as { id: string }).id);
    try {
      const found = await productService.getProductById(id);
      return sendSuccess(reply, found);
    } catch (error) {
      return sendError(reply, 404, (error as Error).message);
    }
  },

  createProduct: async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = createProductSchema.safeParse(request.body);
    if (!parsed.success) return sendError(reply, 400, parsed.error.message);

    try {
      const created = await productService.createProduct(parsed.data);
      return sendSuccess(reply, created, 201);
    } catch (error) {
      return sendError(reply, 500, "Failed to create product");
    }
  },

  updateProduct: async (request: FastifyRequest, reply: FastifyReply) => {
    const id = Number((request.params as { id: string }).id);
    const parsed = updateProductSchema.safeParse(request.body);
    if (!parsed.success) return sendError(reply, 400, parsed.error.message);

    try {
      const updated = await productService.updateProduct(id, parsed.data);
      return sendSuccess(reply, updated);
    } catch (error) {
      return sendError(reply, 404, (error as Error).message);
    }
  },

  deleteProduct: async (request: FastifyRequest, reply: FastifyReply) => {
    const id = Number((request.params as { id: string }).id);
    try {
      await productService.deleteProduct(id);
      return sendSuccess(reply, { message: "Product deleted successfully" });
    } catch (error) {
      return sendError(reply, 404, (error as Error).message);
    }
  },

  updateStock: async (request: FastifyRequest, reply: FastifyReply) => {
    const id = Number((request.params as { id: string }).id);
    const parsed = updateStockSchema.safeParse(request.body);
    if (!parsed.success) return sendError(reply, 400, parsed.error.message);

    try {
      const updated = await productService.updateStock(id, parsed.data.changeAmount, parsed.data.reason);
      return sendSuccess(reply, updated);
    } catch (error) {
      return sendError(reply, 400, (error as Error).message);
    }
  },
};
