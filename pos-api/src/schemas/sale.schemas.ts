import { z } from "zod";

export const createSaleSchema = z.object({
  items: z.array(
    z.object({
      productId: z.number().int().positive(),
      quantity: z.number().int().positive(),
    })
  ),
  employeeId: z.number().int().positive(),
});