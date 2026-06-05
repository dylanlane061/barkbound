CREATE TABLE `catalog_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`radius_miles` real NOT NULL,
	`result_count` integer DEFAULT 0 NOT NULL,
	`cataloged_at` integer NOT NULL
);
