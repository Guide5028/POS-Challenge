import { pgTable, serial, varchar, integer, numeric } from "drizzle-orm/pg-core";
import { category } from "./category.model";

export const product = pgTable("product", {
  productId: serial("product_id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  barcode: varchar("barcode", { length: 50 }).unique(),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(), // never float for money
  categoryId: integer("category_id").references(() => category.categoryId),
});

