import {
  pgTable,
  serial,
  varchar,
  text,
  numeric,
  integer,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { category } from "./category.model";
import { product } from "./product.model";

// the promotion is just the rule (discount type/amount + when it's valid).
// which sale it was used on gets snapshotted on sale_item instead, so old
// receipts stay correct even if the rule here changes later
export const promotion = pgTable("promotion", {
  promotionId: serial("promotion_id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),

  discountType: varchar("discount_type", { length: 20 }).notNull(), // "percentage" | "fixed"
  discountValue: numeric("discount_value", { precision: 10, scale: 2 }).notNull(), // 20 = 20%, or a flat $ amount

  scope: varchar("scope", { length: 20 }).notNull().default("all"), // "all" | "category" | "product"
  categoryId: integer("category_id").references(() => category.categoryId),
  productId: integer("product_id").references(() => product.productId),

  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),

  // lets an admin turn a promo off early without deleting the row
  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Promotion = typeof promotion.$inferSelect;
export type NewPromotion = typeof promotion.$inferInsert;
