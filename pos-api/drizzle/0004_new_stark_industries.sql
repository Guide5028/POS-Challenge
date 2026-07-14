ALTER TABLE "employee" ALTER COLUMN "password_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "employee" ADD COLUMN "google_id" varchar(255);--> statement-breakpoint
ALTER TABLE "employee" ADD COLUMN "facebook_id" varchar(255);--> statement-breakpoint
ALTER TABLE "employee" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "employee" ADD COLUMN "profile_complete" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "employee" ADD CONSTRAINT "employee_google_id_unique" UNIQUE("google_id");--> statement-breakpoint
ALTER TABLE "employee" ADD CONSTRAINT "employee_facebook_id_unique" UNIQUE("facebook_id");