import { FastifyReply, FastifyRequest } from "fastify";
import { categoryService } from "../services/category.service";
import { sendSuccess, sendError } from "../utils/response";
import { createCategorySchema, updateCategorySchema } from "../schemas/category.schemas";

function parseId(request: FastifyRequest, reply: FastifyReply): number | null {
  const id = Number((request.params as { id: string }).id);
  if (Number.isNaN(id)) {
    sendError(reply, 400, "Invalid category id — must be a number");
    return null;
  }
  return id;
}

export const categoryController = {
  getAllCategories: async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as { activeOnly?: string };
    const activeOnly = query.activeOnly === "true";

    try {
      const categories = await categoryService.getAllCategories(activeOnly);
      return sendSuccess(reply, categories);
    } catch (error) {
      return sendError(reply, 500, "Failed to fetch categories");
    }
  },

  getCategoryById: async (request: FastifyRequest, reply: FastifyReply) => {
    const id = parseId(request, reply);
    if (id === null) return;

    try {
      const found = await categoryService.getCategoryById(id);
      return sendSuccess(reply, found);
    } catch (error) {
      return sendError(reply, 404, (error as Error).message);
    }
  },

  createCategory: async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = createCategorySchema.safeParse(request.body);
    if (!parsed.success) return sendError(reply, 400, parsed.error.message);

    try {
      const created = await categoryService.createCategory(parsed.data);
      return sendSuccess(reply, created, 201);
    } catch (error) {
      return sendError(reply, 500, "Failed to create category");
    }
  },

  updateCategory: async (request: FastifyRequest, reply: FastifyReply) => {
    const id = parseId(request, reply);
    if (id === null) return;

    const parsed = updateCategorySchema.safeParse(request.body);
    if (!parsed.success) return sendError(reply, 400, parsed.error.message);

    try {
      const updated = await categoryService.updateCategory(id, parsed.data);
      return sendSuccess(reply, updated);
    } catch (error) {
      return sendError(reply, 404, (error as Error).message);
    }
  },

  deleteCategory: async (request: FastifyRequest, reply: FastifyReply) => {
    const id = parseId(request, reply);
    if (id === null) return;

    try {
      await categoryService.deleteCategory(id);
      return sendSuccess(reply, { message: "Category deleted successfully" });
    } catch (error) {
      const message = (error as Error).message;
      const status = message === "Category not found" ? 404 : 400;
      return sendError(reply, status, message);
    }
  },
};
