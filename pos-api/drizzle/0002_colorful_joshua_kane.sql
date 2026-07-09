ALTER TABLE "employee" ALTER COLUMN "role" SET DEFAULT 'cashier'::"public"."role_enum";--> statement-breakpoint
ALTER TABLE "employee" ALTER COLUMN "role" SET DATA TYPE "public"."role_enum" USING "role"::"public"."role_enum";--> statement-breakpoint
ALTER TABLE "stock_history" ADD COLUMN "cost_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "refund" ADD COLUMN "sale_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "refund" ADD CONSTRAINT "refund_sale_id_sale_sale_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sale"("sale_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "stock_history_product_id_idx" ON "stock_history" USING btree ("product_id");