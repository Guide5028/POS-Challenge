import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";
import { saleItem } from "./saleItem.model";
import { employee } from "./employee.model";

export const refund = pgTable("refund", {
  refundId: serial("refund_id").primaryKey(),
  saleItemId: integer("sale_item_id")
    .notNull()
    .references(() => saleItem.saleItemId),
  quantity: integer("quantity").notNull(),
  reason: varchar("reason", { length: 255 }),
  refundedAt: timestamp("refunded_at").notNull().defaultNow(),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employee.employeeId),
});
