ALTER TABLE "product" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "price_old" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "badge" varchar(20);--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "sku" varchar(50);--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "weight" varchar(50);--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "dimensions" varchar(100);--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "material" varchar(255);--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_sku_unique" UNIQUE("sku");