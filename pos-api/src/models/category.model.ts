import { pgTable, serial, varchar, integer } from "drizzle-orm/pg-core";
import { tax } from "./tax.model";

export const category = pgTable("category", {
  categoryId: serial("category_id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: varchar("description", { length: 255 }),
  taxId: integer("tax_id").references(() => tax.taxId), // one Tax -> many Category
});
