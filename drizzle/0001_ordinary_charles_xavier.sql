ALTER TABLE `places` ADD `category` text;--> statement-breakpoint
ALTER TABLE `trip_nodes` ADD `sort_order` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `trip_nodes` ADD `nights` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `trip_nodes` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `trip_nodes` ADD `color_index` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `trips` ADD `status` text DEFAULT 'planning' NOT NULL;--> statement-breakpoint
ALTER TABLE `trips` ADD `region` text;--> statement-breakpoint
ALTER TABLE `trips` ADD `cover_tone` text DEFAULT 'green' NOT NULL;--> statement-breakpoint
ALTER TABLE `trips` ADD `updated_at` integer DEFAULT 0 NOT NULL;