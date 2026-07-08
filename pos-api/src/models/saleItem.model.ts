import { pgTable, serial, integer, numeric } from "drizzle-orm/pg-core";
import { sale } from "./sale.model";
import { product } from "./product.model";

export const saleItem = pgTable("sale_item", {
  saleItemId: serial("sale_item_id").primaryKey(),
  saleId: integer("sale_id")
    .notNull()
    .references(() => sale.saleId),
  productId: integer("product_id")
    .notNull()
    .references(() => product.productId),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
});
