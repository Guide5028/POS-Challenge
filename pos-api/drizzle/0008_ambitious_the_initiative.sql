ALTER TABLE "customer" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "customer" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "customer" ADD COLUMN "password_hash" varchar(255);--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_email_unique" UNIQUE("email");