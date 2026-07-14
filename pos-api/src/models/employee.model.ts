import { pgEnum, pgTable, serial, varchar, boolean } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role_enum", ["cashier", "admin"]);

export const employee = pgTable("employee", {
  employeeId: serial("employee_id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 150 }).notNull().unique(),
  // nullable now — social-only accounts (Google/Facebook) never set a password
  passwordHash: varchar("password_hash", { length: 255 }),
  role: roleEnum("role").notNull().default("cashier"),
  googleId: varchar("google_id", { length: 255 }).unique(),
  facebookId: varchar("facebook_id", { length: 255 }).unique(),
  // gates whether the account can log in at all — local /register defaults true;
  // brand-new social sign-ups land false until an admin approves them
  isActive: boolean("is_active").notNull().default(true),
  // gates checkout, not login — confirms the name on the account is real,
  // for sale/refund accountability. Local /register already asks for a name
  // so it defaults true; social sign-up sets it false until they confirm
  profileComplete: boolean("profile_complete").notNull().default(true),
});
