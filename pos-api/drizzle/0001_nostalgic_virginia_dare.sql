CREATE TYPE "public"."role_enum" AS ENUM('cashier', 'admin');--> statement-breakpoint
CREATE TABLE "promotion" (
	"promotion_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"discount_type" varchar(20) NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"scope" varchar(20) DEFAULT 'all' NOT NULL,
	"category_id" integer,
	"product_id" integer,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tax" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "tax" CASCADE;--> statement-breakpoint
ALTER TABLE "stock" RENAME TO "stock_history";--> statement-breakpoint
ALTER TABLE "category" DROP CONSTRAINT "category_tax_id_tax_tax_id_fk";
--> statement-breakpoint
ALTER TABLE "stock_history" DROP CONSTRAINT "stock_product_id_product_product_id_fk";
--> statement-breakpoint
ALTER TABLE "category" ALTER COLUMN "description" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "sale_item" ADD COLUMN "promotion_id" integer;--> statement-breakpoint
ALTER TABLE "sale_item" ADD COLUMN "discount_amount" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "promotion" ADD CONSTRAINT "promotion_category_id_category_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("category_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion" ADD CONSTRAINT "promotion_product_id_product_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("product_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_item" ADD CONSTRAINT "sale_item_promotion_id_promotion_promotion_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotion"("promotion_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_history" ADD CONSTRAINT "stock_history_product_id_product_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("product_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category" DROP COLUMN "tax_id";--> statement-breakpoint
ALTER TABLE "product" DROP COLUMN "stock_quantity";--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_name_unique" UNIQUE("name");