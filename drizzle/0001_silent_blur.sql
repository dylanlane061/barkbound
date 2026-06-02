ALTER TABLE "places" ADD COLUMN "canonical_source" text;--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "external_id" text;--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "assessed_at" timestamp;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_external_id_unique" UNIQUE("external_id");