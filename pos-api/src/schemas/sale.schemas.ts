import { z } from "zod";

export const createSaleSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  employeeId: z.number().int().positive(),
  paymentMethod: z.enum(["cash", "card", "e-wallet"]),
  amountPaid: z.number().positive(),
  customerId: z.number().int().positive().optional(),
});
