import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1),
  barcode: z.string().optional(),
  price: z.number().positive(),
  stockQuantity: z.number().int().min(0).default(0),
  categoryId: z.number().int().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const updateStockSchema = z.object({
  changeAmount: z.number().int().refine((v) => v !== 0, "changeAmount cannot be 0"),
  reason: z.enum(["restock", "damage", "correction"]),
});

export const listProductsQuerySchema = z.object({
  categoryId: z.coerce.number().int().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["name", "price", "stockQuantity"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});
