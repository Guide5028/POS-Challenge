import { z } from "zod";

export const createRefundSchema = z.object({
  saleItemId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  reason: z.string().min(1).max(255),
  employeeId: z.number().int().positive(),
});
