import {
  pgTable,
  serial,
  varchar,
  numeric,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { category } from "./category.model";

export const product = pgTable("product", {
  productId: serial("product_id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  barcode: varchar("barcode", { length: 50 }).unique(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  categoryId: integer("category_id").references(() => category.categoryId),
  isActive: boolean("is_active").notNull().default(true),
  imageUrl: varchar("image_url", { length: 500 }),
});
