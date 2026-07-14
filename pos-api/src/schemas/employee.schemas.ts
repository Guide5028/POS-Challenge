import { z } from "zod";

export const updateEmployeeSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(["cashier", "admin"]).optional(),
});
