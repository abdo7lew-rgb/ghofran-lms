DROP INDEX "attendance_student_date_idx";--> statement-breakpoint
DROP INDEX "users_email_unique";--> statement-breakpoint
ALTER TABLE `memorization_session_items` ALTER COLUMN "from_ayah" TO "from_ayah" integer;--> statement-breakpoint
CREATE UNIQUE INDEX `attendance_student_date_idx` ON `attendance_records` (`student_id`,`date`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
ALTER TABLE `memorization_session_items` ADD `from_text` text;