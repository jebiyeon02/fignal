CREATE TABLE `verification_history` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`product_name` text NOT NULL,
	`product_number` text NOT NULL,
	`product_maker` text NOT NULL,
	`product_image` text DEFAULT '' NOT NULL,
	`product_official_url` text DEFAULT '' NOT NULL,
	`verdict` text NOT NULL,
	`summary` text NOT NULL,
	`evidence_completeness` integer NOT NULL,
	`photo_count` integer NOT NULL,
	`risk_signal_count` integer NOT NULL,
	`matched_case_count` integer NOT NULL,
	`analysis_json` text NOT NULL,
	`prompt_version` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_history_created_at_idx` ON `verification_history` (`created_at`);