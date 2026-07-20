CREATE TABLE `community_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`verification_id` text NOT NULL,
	`title` text NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'collecting' NOT NULL,
	`helpful_count` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `community_posts_verification_idx` ON `community_posts` (`verification_id`);--> statement-breakpoint
CREATE INDEX `community_posts_created_at_idx` ON `community_posts` (`created_at`);--> statement-breakpoint
ALTER TABLE `verification_history` ADD `community_publish_token_hash` text DEFAULT '' NOT NULL;