import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";
import { product } from "./product.model";

export const stock = pgTable("stock", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => product.productId), // fixed: was "name (FK)" in the diagram
  changeAmount: integer("change_amount").notNull(), // can be negative
  reason: varchar("reason", { length: 20 }).notNull(), // sale | restock | damage
  changedAt: timestamp("changed_at").notNull().defaultNow(),
});
