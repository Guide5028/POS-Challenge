import zod from "zod";

export const createCategorySchema = zod.object({
  name: zod.string().min(1),
  description: zod.string().optional(),
  isActive: zod.boolean().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();