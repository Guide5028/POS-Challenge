import { z } from "zod";

const baseSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().optional(),
    discountType: z.enum(["percentage", "fixed"]),
    discountValue: z.number().positive(),
    scope: z.enum(["all", "category", "product"]),
    categoryId: z.number().int().positive().optional(),
    productId: z.number().int().positive().optional(),
    startDate: z.coerce.date(), // JSON sends strings, coerce to real Date
    endDate: z.coerce.date(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => data.discountType !== "percentage" || data.discountValue <= 100, {
    message: "discountValue must be <= 100 when discountType is 'percentage'",
    path: ["discountValue"],
  })
  .refine((data) => data.scope !== "category" || data.categoryId !== undefined, {
    message: "categoryId is required when scope is 'category'",
    path: ["categoryId"],
  })
  .refine((data) => data.scope !== "product" || data.productId !== undefined, {
    message: "productId is required when scope is 'product'",
    path: ["productId"],
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "endDate must be after startDate",
    path: ["endDate"],
  });

export const createPromotionSchema = baseSchema;

// no cross-field checks here since an update might only send one field
export const updatePromotionSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  discountType: z.enum(["percentage", "fixed"]).optional(),
  discountValue: z.number().positive().optional(),
  scope: z.enum(["all", "category", "product"]).optional(),
  categoryId: z.number().int().positive().optional(),
  productId: z.number().int().positive().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
});

export const listPromotionsQuerySchema = z.object({
  activeOnly: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});
