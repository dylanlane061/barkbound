CREATE TABLE `places` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`address` text,
	`city` text,
	`state` text,
	`latitude` real,
	`longitude` real,
	`canonical_source` text,
	`external_id` text,
	`assessed_at` integer,
	`last_ingested_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `raw_records` (
	`id` text PRIMARY KEY NOT NULL,
	`place_id` text NOT NULL,
	`source` text NOT NULL,
	`source_entity_id` text NOT NULL,
	`raw` text NOT NULL,
	`fetched_at` integer NOT NULL,
	FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `signals` (
	`id` text PRIMARY KEY NOT NULL,
	`place_id` text NOT NULL,
	`category` text NOT NULL,
	`value` text,
	`confidence` real NOT NULL,
	`evidence_ids` text NOT NULL,
	`extracted_at` integer NOT NULL,
	FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `trip_nodes` (
	`id` text PRIMARY KEY NOT NULL,
	`trip_id` text NOT NULL,
	`label` text,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`radius_miles` real DEFAULT 25 NOT NULL,
	`ingested_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `trip_places` (
	`id` text PRIMARY KEY NOT NULL,
	`trip_id` text NOT NULL,
	`place_id` text NOT NULL,
	`added_at` integer NOT NULL,
	`notes` text,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `trips` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `places_external_id_unique` ON `places` (`external_id`);