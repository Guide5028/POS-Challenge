import { FastifyReply, FastifyRequest } from "fastify";
import { productService } from "../services/product.service";
import { sendSuccess, sendError } from "../utils/response";
import { uploadProductImage } from "../utils/storage";
import {
  createProductSchema,
  updateProductSchema,
  updateStockSchema,
  listProductsQuerySchema,
} from "../schemas/product.schemas";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// params.id is always a string — bail out early with a clean 400 if it's
function parseId(request: FastifyRequest, reply: FastifyReply): number | null {
  const id = Number((request.params as { id: string }).id);
  if (Number.isNaN(id)) {
    sendError(reply, 400, "Invalid product id — must be a number");
    return null;
  }
  return id;
}

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
    const id = parseId(request, reply);
    if (id === null) return;

    try {
      const found = await productService.getProductById(id);
      return sendSuccess(reply, found);
    } catch (error) {
      return sendError(reply, 404, (error as Error).message);
    }
  },

  getProductByBarcode: async (request: FastifyRequest, reply: FastifyReply) => {
    const { barcode } = request.params as { barcode: string };

    try {
      const found = await productService.getProductByBarcode(barcode);
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
    const id = parseId(request, reply);
    if (id === null) return;

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
    const id = parseId(request, reply);
    if (id === null) return;

    try {
      await productService.deleteProduct(id);
      return sendSuccess(reply, { message: "Product deleted successfully" });
    } catch (error) {
      const message = (error as Error).message;
      const status = message === "Product not found" ? 404 : 400;
      return sendError(reply, status, message);
    }
  },

  updateStock: async (request: FastifyRequest, reply: FastifyReply) => {
    const id = parseId(request, reply);
    if (id === null) return;

    const parsed = updateStockSchema.safeParse(request.body);
    if (!parsed.success) return sendError(reply, 400, parsed.error.message);

    try {
      const updated = await productService.updateStock(
        id,
        parsed.data.changeAmount,
        parsed.data.reason,
        parsed.data.costPrice,
      );
      return sendSuccess(reply, updated);
    } catch (error) {
      return sendError(reply, 400, (error as Error).message);
    }
  },

  uploadImage: async (request: FastifyRequest, reply: FastifyReply) => {
    const id = parseId(request, reply);
    if (id === null) return;

    const file = await request.file();
    if (!file) return sendError(reply, 400, "No file uploaded");
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return sendError(reply, 400, "Only JPEG, PNG, or WebP images are allowed");
    }

    try {
      const buffer = await file.toBuffer();
      const imageUrl = await uploadProductImage(id, buffer, file.mimetype, file.filename);
      const updated = await productService.updateProductImage(id, imageUrl);
      return sendSuccess(reply, updated);
    } catch (error) {
      return sendError(reply, 400, (error as Error).message);
    }
  },
};
