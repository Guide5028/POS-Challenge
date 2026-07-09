import { pgTable, serial, varchar, text, boolean } from "drizzle-orm/pg-core";

// name is unique so we don't end up with "Beverages" and "beverages" as
// two separate rows (product.service.ts also does a case-insensitive check)
export const category = pgTable("category", {
  categoryId: serial("category_id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),

  description: text("description"),

  // lets us hide a category instead of deleting it (deleting would break FKs)
  isActive: boolean("is_active").notNull().default(true),
});
