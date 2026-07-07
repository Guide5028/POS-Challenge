CREATE TABLE "employee" (
	"employee_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(150) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" varchar(20) DEFAULT 'cashier' NOT NULL,
	CONSTRAINT "employee_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "customer" (
	"customer_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100),
	"email" varchar(150),
	"phone" varchar(20),
	"address" varchar(255),
	"point_balance" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax" (
	"tax_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"rate" numeric(5, 4) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category" (
	"category_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(255),
	"tax_id" integer
);
--> statement-breakpoint
CREATE TABLE "product" (
	"product_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"barcode" varchar(50),
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"category_id" integer,
	CONSTRAINT "product_barcode_unique" UNIQUE("barcode")
);
--> statement-breakpoint
CREATE TABLE "sale" (
	"sale_id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"payment_method" varchar(20) NOT NULL,
	"amount_paid" numeric(10, 2) NOT NULL,
	"change_given" numeric(10, 2) DEFAULT '0' NOT NULL,
	"employee_id" integer NOT NULL,
	"customer_id" integer
);
--> statement-breakpoint
CREATE TABLE "sale_item" (
	"sale_item_id" serial PRIMARY KEY NOT NULL,
	"sale_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"change_amount" integer NOT NULL,
	"reason" varchar(20) NOT NULL,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refund" (
	"refund_id" serial PRIMARY KEY NOT NULL,
	"sale_item_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"reason" varchar(255),
	"refunded_at" timestamp DEFAULT now() NOT NULL,
	"employee_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_tax_id_tax_tax_id_fk" FOREIGN KEY ("tax_id") REFERENCES "public"."tax"("tax_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_category_id_category_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("category_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale" ADD CONSTRAINT "sale_employee_id_employee_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employee"("employee_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale" ADD CONSTRAINT "sale_customer_id_customer_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("customer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_item" ADD CONSTRAINT "sale_item_sale_id_sale_sale_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sale"("sale_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_item" ADD CONSTRAINT "sale_item_product_id_product_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("product_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock" ADD CONSTRAINT "stock_product_id_product_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("product_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund" ADD CONSTRAINT "refund_sale_item_id_sale_item_sale_item_id_fk" FOREIGN KEY ("sale_item_id") REFERENCES "public"."sale_item"("sale_item_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund" ADD CONSTRAINT "refund_employee_id_employee_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employee"("employee_id") ON DELETE no action ON UPDATE no action;