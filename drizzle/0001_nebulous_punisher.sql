CREATE TABLE `charges` (
	`id` text PRIMARY KEY NOT NULL,
	`hotel` text NOT NULL,
	`stay` text NOT NULL,
	`request` text NOT NULL,
	`title` text NOT NULL,
	`amount` integer NOT NULL,
	`voided` integer NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `charge_request` ON `charges` (`request`);--> statement-breakpoint
CREATE INDEX `charge_stay` ON `charges` (`stay`);