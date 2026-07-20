CREATE TABLE `site_feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`message` text NOT NULL,
	`page_path` text DEFAULT '/' NOT NULL,
	`page_context` text DEFAULT 'search' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `site_feedback_created_at_idx` ON `site_feedback` (`created_at`);