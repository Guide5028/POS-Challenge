import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";
import { saleItem } from "./saleItem.model";
import { employee } from "./employee.model";
import { sale } from "./sale.model";

export const refund = pgTable("refund", {
  refundId: serial("refund_id").primaryKey(),
  saleItemId: integer("sale_item_id")
    .notNull()
    .references(() => saleItem.saleItemId),
  saleId: integer("sale_id")
    .notNull()
    .references(() => sale.saleId),
  quantity: integer("quantity").notNull(),
  reason: varchar("reason", { length: 255 }),
  refundedAt: timestamp("refunded_at").notNull().defaultNow(),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employee.employeeId),
});
