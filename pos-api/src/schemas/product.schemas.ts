import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1),
  barcode: z.string().optional(),
  price: z.number().positive(),
  stockQuantity: z.number().int().min(0).default(0),
  costPrice: z.number().positive().optional(), // what you paid, for initial stock
  category: z.string().optional(),
  isActive: z.boolean().optional(),
});

// updates can't touch stockQuantity directly — use /stock instead
export const updateProductSchema = createProductSchema
  .omit({ stockQuantity: true, costPrice: true })
  .partial();

export const updateStockSchema = z.object({
  changeAmount: z
    .number()
    .int()
    .refine((v) => v !== 0, "changeAmount cannot be 0"),
  reason: z.enum(["restock", "damage", "correction"]),
  costPrice: z.number().positive().optional(), // relevant when reason is "restock"
});

export const listProductsQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["name", "price", "stockQuantity"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  activeOnly: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});
