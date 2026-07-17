ALTER TABLE `memorization_sessions` RENAME TO `memorization_sessions_old`;
--> statement-breakpoint
CREATE TABLE `memorization_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`student_id` integer NOT NULL,
	`date` text NOT NULL,
	`session_type` text NOT NULL,
	`notes` text,
	`recorded_by` integer,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `memorization_session_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`surah_number` integer NOT NULL,
	`from_ayah` integer NOT NULL,
	`to_ayah` integer NOT NULL,
	`rating` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `memorization_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `memorization_sessions` (`id`, `student_id`, `date`, `session_type`, `notes`, `recorded_by`, `created_at`)
SELECT `id`, `student_id`, `date`, `session_type`, `notes`, `recorded_by`, `created_at` FROM `memorization_sessions_old`;
--> statement-breakpoint
INSERT INTO `memorization_session_items` (`session_id`, `surah_number`, `from_ayah`, `to_ayah`, `rating`, `sort_order`)
SELECT `id`, `surah_number`, `from_ayah`, `to_ayah`, `rating`, 0 FROM `memorization_sessions_old`;
--> statement-breakpoint
DROP TABLE `memorization_sessions_old`;
