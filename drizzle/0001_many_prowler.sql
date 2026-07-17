CREATE TABLE `verification_report_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`verification_id` text NOT NULL,
	`evidence_key` text NOT NULL,
	`object_key` text NOT NULL,
	`content_type` text NOT NULL,
	`byte_size` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `verification_report_images_verification_evidence_idx` ON `verification_report_images` (`verification_id`,`evidence_key`);--> statement-breakpoint
CREATE INDEX `verification_report_images_object_key_idx` ON `verification_report_images` (`object_key`);