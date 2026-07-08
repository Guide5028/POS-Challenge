import { pgEnum, pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role_enum", ["cashier", "admin"]);

export const employee = pgTable("employee", {
  employeeId: serial("employee_id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 150 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("cashier"), // 'cashier' | 'admin'
});
