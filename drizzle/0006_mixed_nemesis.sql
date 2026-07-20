CREATE TABLE `site_events` (
	`id` text PRIMARY KEY NOT NULL,
	`session_hash` text NOT NULL,
	`event_name` text NOT NULL,
	`page_path` text DEFAULT '/' NOT NULL,
	`page_context` text DEFAULT 'other' NOT NULL,
	`product_id` text,
	`verification_id` text,
	`properties_json` text DEFAULT '{}' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `site_events_created_at_idx` ON `site_events` (`created_at`);--> statement-breakpoint
CREATE INDEX `site_events_event_created_at_idx` ON `site_events` (`event_name`,`created_at`);--> statement-breakpoint
CREATE INDEX `site_events_session_created_at_idx` ON `site_events` (`session_hash`,`created_at`);--> statement-breakpoint
CREATE INDEX `site_events_product_created_at_idx` ON `site_events` (`product_id`,`created_at`);