import {
  pgTable,
  serial,
  varchar,
  numeric,
  integer,
} from "drizzle-orm/pg-core";
import { category } from "./category.model";

export const product = pgTable("product", {
  productId: serial("product_id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  barcode: varchar("barcode", { length: 50 }).unique(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(), // numeric, not float — money
  categoryId: integer("category_id").references(() => category.categoryId),
});
