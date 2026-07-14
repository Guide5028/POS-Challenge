import { db } from "../db/client";
import { employee } from "../models/employee.model";
import { eq } from "drizzle-orm";
import { comparePasswords, hashPassword } from "../utils/password";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import crypto from "crypto";

type SocialProvider = "google" | "facebook";

function toProfile(e: typeof employee.$inferSelect) {
  return {
    employeeId: e.employeeId,
    name: e.name,
    email: e.email,
    role: e.role,
    profileComplete: e.profileComplete,
  };
}

export const authService = {
  async login(email: string, password: string) {
    const [existingEmployee] = await db
      .select()
      .from(employee)
      .where(eq(employee.email, email));

    if (!existingEmployee || !existingEmployee.passwordHash) {
      // no passwordHash means this account only has social login set up
      throw new Error("Invalid credentials");
    }

    const passwordMatches = await comparePasswords(
      password,
      existingEmployee.passwordHash,
    );
    if (!passwordMatches) {
      throw new Error("Invalid credentials");
    }
    if (!existingEmployee.isActive) {
      throw new Error(
        "Your account has been disabled. Contact an admin to reactivate it.",
      );
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
      profile: toProfile(existingEmployee),
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
    const [created] = await db
      .insert(employee)
      .values({ email, passwordHash, name })
      .returning();

    return toProfile(created);
  },

  async refreshToken(token: string) {
    const decoded = verifyRefreshToken(token); // throws if invalid/expired
    return signAccessToken({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      sessionId: crypto.randomUUID(),
    });
  },

  async getProfile(employeeId: number) {
    const [found] = await db
      .select()
      .from(employee)
      .where(eq(employee.employeeId, employeeId));
    if (!found) throw new Error("Employee not found");

    return toProfile(found);
  },

  async updateProfile(employeeId: number, name: string) {
    const [updated] = await db
      .update(employee)
      .set({ name, profileComplete: true })
      .where(eq(employee.employeeId, employeeId))
      .returning();
    if (!updated) throw new Error("Employee not found");

    return toProfile(updated);
  },

  // shared by both the Google and Facebook callback routes
  async loginWithSocial(
    provider: SocialProvider,
    providerId: string,
    email: string,
    name: string,
  ) {
    const idColumn = provider === "google" ? employee.googleId : employee.facebookId;

    let [found] = await db.select().from(employee).where(eq(idColumn, providerId));

    if (!found) {
      // not linked yet — does an employee with this email already exist
      // (created via /register, or via the other social provider)?
      const [byEmail] = await db
        .select()
        .from(employee)
        .where(eq(employee.email, email));

      if (byEmail) {
        [found] = await db
          .update(employee)
          .set(provider === "google" ? { googleId: providerId } : { facebookId: providerId })
          .where(eq(employee.employeeId, byEmail.employeeId))
          .returning();
      }
    }

    if (!found) {
      // brand new person — auto-create, but pending admin approval and
      // needs to confirm their name before they can check anyone out
      [found] = await db
        .insert(employee)
        .values({
          name,
          email,
          role: "cashier",
          isActive: false,
          profileComplete: false,
          ...(provider === "google" ? { googleId: providerId } : { facebookId: providerId }),
        })
        .returning();
    }

    if (!found.isActive) {
      return { pending: true as const, profile: toProfile(found) };
    }

    const payload = {
      userId: found.employeeId,
      email: found.email,
      role: found.role as "admin" | "cashier",
      sessionId: crypto.randomUUID(),
    };

    return {
      pending: false as const,
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
      profile: toProfile(found),
    };
  },
};
