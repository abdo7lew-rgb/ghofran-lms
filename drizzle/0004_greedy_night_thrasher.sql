CREATE TABLE `circle_teachers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`circle_id` integer NOT NULL,
	`teacher_id` integer NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`circle_id`) REFERENCES `circles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `circle_teachers_unique_idx` ON `circle_teachers` (`circle_id`,`teacher_id`);--> statement-breakpoint
ALTER TABLE `circles` DROP COLUMN `teacher_id`;