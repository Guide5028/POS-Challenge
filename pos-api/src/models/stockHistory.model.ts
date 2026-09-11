import {
  pgTable,
  serial,
  integer,
  varchar,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { product } from "./product.model";
import { employee } from "./employee.model";

// log of every stock change — current stock = sum(changeAmount) per product
export const stockHistory = pgTable(
  "stock_history",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => product.productId),
    changeAmount: integer("change_amount").notNull(), // can be negative
    reason: varchar("reason", { length: 20 }).notNull(), // sale | refund | restock | damage | correction
    costPrice: numeric("cost_price", { precision: 10, scale: 2 }),
    changedAt: timestamp("changed_at").notNull().defaultNow(),
    // nullable -- rows written before this column existed have no author on
    // record; every new row from here on gets it from the authenticated
    // admin's JWT (req.user.userId), never from client-supplied input
    employeeId: integer("employee_id").references(() => employee.employeeId),
  },
  (table) => [index("stock_history_product_id_idx").on(table.productId)],
);
