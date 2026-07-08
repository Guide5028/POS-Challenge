import {
  pgTable,
  serial,
  timestamp,
  numeric,
  varchar,
  integer,
} from "drizzle-orm/pg-core";
import { employee } from "./employee.model";
import { customer } from "./customer.model";

export const sale = pgTable("sale", {
  saleId: serial("sale_id").primaryKey(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 20 }).notNull(), // cash | card | e-wallet
  amountPaid: numeric("amount_paid", { precision: 10, scale: 2 }).notNull(),
  changeGiven: numeric("change_given", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employee.employeeId),
  customerId: integer("customer_id").references(() => customer.customerId), // nullable: walk-in sale
});
