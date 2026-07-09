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
  },
  (table) => [index("stock_history_product_id_idx").on(table.productId)],
);
