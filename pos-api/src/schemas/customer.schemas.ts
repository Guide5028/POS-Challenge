import { z } from "zod";

export const registerCustomerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

export const loginCustomerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// admin-only: point balance and contact info, not the account credentials
export const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  pointBalance: z.number().int().min(0).optional(),
});
