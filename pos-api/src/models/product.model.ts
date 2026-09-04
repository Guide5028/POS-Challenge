import {
  pgTable,
  serial,
  varchar,
  numeric,
  integer,
  boolean,
  text,
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
  description: text("description"),
  // storefront-only display fields (a plain eCommerce catalog, not POS stock data)
  priceOld: numeric("price_old", { precision: 10, scale: 2 }), // set only when the item is on sale
  badge: varchar("badge", { length: 20 }), // "new" | "sale" -- label text (e.g. "-30%") is derived from price/priceOld, not stored
  sku: varchar("sku", { length: 50 }).unique(),
  weight: varchar("weight", { length: 50 }), // free-text display value, e.g. "5 kg"
  dimensions: varchar("dimensions", { length: 100 }), // free-text display value, e.g. "45 x 50 x 80 cm"
  material: varchar("material", { length: 255 }),
});
