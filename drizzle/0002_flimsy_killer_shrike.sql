CREATE TABLE `bar_tables` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_bar_tables_name` ON `bar_tables` (`name`);--> statement-breakpoint
CREATE TABLE `table_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`table_id` integer NOT NULL,
	`opened_at` text NOT NULL,
	`closed_at` text,
	FOREIGN KEY (`table_id`) REFERENCES `bar_tables`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_table_sessions_table_opened` ON `table_sessions` (`table_id`,`opened_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_table_sessions_one_open` ON `table_sessions` (`table_id`) WHERE "table_sessions"."closed_at" is null;--> statement-breakpoint
ALTER TABLE `movements` ADD `session_id` integer REFERENCES table_sessions(id);