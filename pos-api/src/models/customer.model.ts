import { pgTable, serial, varchar, integer } from "drizzle-orm/pg-core";

export const customer = pgTable("customer", {
  customerId: serial("customer_id").primaryKey(),
  name: varchar("name", { length: 100 }),
  email: varchar("email", { length: 150 }),
  phone: varchar("phone", { length: 20 }),
  address: varchar("address", { length: 255 }),
  pointBalance: integer("point_balance").notNull().default(0),
});
