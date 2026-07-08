import { db } from "../db/client";
import { employee } from "../models/employee.model";
import { eq } from "drizzle-orm";
import { comparePasswords, hashPassword } from "../utils/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import crypto from "crypto";

export const authService = {
  async login(email: string, password: string) {
    // Drizzle query: eq(column, value) is a function, not a method on the column.
    const [existingEmployee] = await db
      .select()
      .from(employee)
      .where(eq(employee.email, email));

    if (!existingEmployee) {
      throw new Error("Invalid credentials");
    }

    const passwordMatches = await comparePasswords(
      password,
      existingEmployee.passwordHash
    );
    if (!passwordMatches) {
      throw new Error("Invalid credentials");
    }

    const payload = {
      userId: existingEmployee.employeeId,
      email: existingEmployee.email,
      role: existingEmployee.role as "admin" | "cashier",
      sessionId: crypto.randomUUID(),
    };

    return {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
      profile: {
        employeeId: existingEmployee.employeeId,
        name: existingEmployee.name,
        email: existingEmployee.email,
        role: existingEmployee.role,
      },
    };
  },

  async register(email: string, password: string, name: string) {
    const [existing] = await db
      .select()
      .from(employee)
      .where(eq(employee.email, email));
    if (existing) {
      throw new Error("Email already registered");
    }

    const passwordHash = await hashPassword(password);

    // role is intentionally left out here — it defaults to 'cashier' in the
    // DB schema. Promoting someone to 'admin' should go through an
    // admin-only employee-management endpoint, not open self-registration.
    const [created] = await db
      .insert(employee)
      .values({ email, passwordHash, name })
      .returning();

    return {
      employeeId: created.employeeId,
      name: created.name,
      email: created.email,
      role: created.role,
    };
  },

  async refreshToken(token: string) {
    // Throws if expired or signed with the wrong secret — caught by the
    // controller and turned into a 401.
    const decoded = verifyRefreshToken(token);

    // Re-issue a fresh access token with the same identity claims, but a
    // new sessionId so it's distinguishable from the original login.
    return signAccessToken({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      sessionId: crypto.randomUUID(),
    });
  },

  async getProfile(employeeId: number) {
    const [found] = await db.select().from(employee).where(eq(employee.employeeId, employeeId));
    if (!found) throw new Error("Employee not found");

    return {
      employeeId: found.employeeId,
      name: found.name,
      email: found.email,
      role: found.role,
    };
  },
};
