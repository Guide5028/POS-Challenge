import { pgTable, serial, varchar, numeric } from "drizzle-orm/pg-core";

export const tax = pgTable("tax", {
  taxId: serial("tax_id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(), // "VAT", "Exempt"
  rate: numeric("rate", { precision: 5, scale: 4 }).notNull(), // 0.1000 = 10%
});
