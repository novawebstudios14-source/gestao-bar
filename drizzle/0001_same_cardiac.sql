CREATE TABLE `recipes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`ingredient_id` integer NOT NULL,
	`quantity` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ingredient_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_recipes_product_ingredient` ON `recipes` (`product_id`,`ingredient_id`);--> statement-breakpoint
ALTER TABLE `movements` ADD `note` text;--> statement-breakpoint
ALTER TABLE `movements` ADD `sale_key` text;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_movements_sale_key` ON `movements` (`sale_key`);--> statement-breakpoint
ALTER TABLE `products` ADD `kind` text DEFAULT 'stock' NOT NULL;