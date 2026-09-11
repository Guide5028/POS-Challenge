import { db } from "../db/client";
import { customer } from "../models/customer.model";
import { eq } from "drizzle-orm";
import { comparePasswords, hashPassword } from "../utils/password";
import { signAccessToken, signRefreshToken } from "../utils/jwt";
import crypto from "crypto";

function toProfile(c: typeof customer.$inferSelect) {
  return {
    customerId: c.customerId,
    name: c.name,
    email: c.email,
    phone: c.phone,
    address: c.address,
    pointBalance: c.pointBalance,
    // distinguishes a customer profile from an employee profile in the shared
    // AuthContext/frontend (employee profiles carry role: "admin" | "cashier")
    role: "customer" as const,
  };
}

export const customerService = {
  async register(email: string, password: string, name: string) {
    const [existing] = await db.select().from(customer).where(eq(customer.email, email));
    if (existing) throw new Error("Email already registered");

    const passwordHash = await hashPassword(password);
    const [created] = await db.insert(customer).values({ email, passwordHash, name }).returning();

    return toProfile(created);
  },

  async login(email: string, password: string) {
    const [found] = await db.select().from(customer).where(eq(customer.email, email));
    if (!found || !found.passwordHash) throw new Error("Invalid credentials");

    const passwordMatches = await comparePasswords(password, found.passwordHash);
    if (!passwordMatches) throw new Error("Invalid credentials");

    const payload = {
      userId: found.customerId,
      email: found.email,
      role: "customer" as const,
      sessionId: crypto.randomUUID(),
    };

    return {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
      profile: toProfile(found),
    };
  },

  async getProfile(customerId: number) {
    const [found] = await db.select().from(customer).where(eq(customer.customerId, customerId));
    if (!found) throw new Error("Customer not found");
    return toProfile(found);
  },

  // admin-only
  async getAllCustomers() {
    const rows = await db.select().from(customer);
    return rows.map(toProfile);
  },

  // admin-only
  async updateCustomer(
    customerId: number,
    data: Partial<{ name: string; phone: string; address: string; pointBalance: number }>,
  ) {
    const updateValues: Record<string, unknown> = { ...data };
    Object.keys(updateValues).forEach((k) => updateValues[k] === undefined && delete updateValues[k]);

    const [updated] = await db
      .update(customer)
      .set(updateValues)
      .where(eq(customer.customerId, customerId))
      .returning();
    if (!updated) throw new Error("Customer not found");

    return toProfile(updated);
  },
};
