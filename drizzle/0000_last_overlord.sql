CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`hotel` text NOT NULL,
	`request` text NOT NULL,
	`actor` text NOT NULL,
	`kind` text NOT NULL,
	`body` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `events_request` ON `events` (`request`);--> statement-breakpoint
CREATE TABLE `hotels` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`owner` text NOT NULL,
	`config` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`until` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`hotel` text NOT NULL,
	`email` text NOT NULL,
	`user` text,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`department` text NOT NULL,
	`active` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_hotel_email` ON `members` (`hotel`,`email`);--> statement-breakpoint
CREATE TABLE `places` (
	`id` text PRIMARY KEY NOT NULL,
	`hotel` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`config` text NOT NULL,
	`active` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `places_hotel` ON `places` (`hotel`);--> statement-breakpoint
CREATE TABLE `requests` (
	`id` text PRIMARY KEY NOT NULL,
	`hotel` text NOT NULL,
	`room` text NOT NULL,
	`stay` text,
	`session` text NOT NULL,
	`source` text NOT NULL,
	`name` text NOT NULL,
	`contact` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`department` text NOT NULL,
	`items` text NOT NULL,
	`details` text NOT NULL,
	`total` integer,
	`status` text NOT NULL,
	`assignee` text,
	`created` integer NOT NULL,
	`updated` integer NOT NULL,
	`due` integer NOT NULL,
	`version` integer NOT NULL,
	`retry` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `requests_retry` ON `requests` (`session`,`retry`);--> statement-breakpoint
CREATE INDEX `requests_hotel` ON `requests` (`hotel`);--> statement-breakpoint
CREATE INDEX `requests_stay` ON `requests` (`stay`);--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`hotel` text NOT NULL,
	`label` text NOT NULL,
	`kind` text NOT NULL,
	`qr` text NOT NULL,
	`active` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rooms_qr` ON `rooms` (`qr`);--> statement-breakpoint
CREATE INDEX `rooms_hotel` ON `rooms` (`hotel`);--> statement-breakpoint
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`hotel` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`department` text NOT NULL,
	`audience` text NOT NULL,
	`status` text NOT NULL,
	`config` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `services_hotel` ON `services` (`hotel`);--> statement-breakpoint
CREATE TABLE `guest_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`room` text NOT NULL,
	`stay` text,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stays` (
	`id` text PRIMARY KEY NOT NULL,
	`hotel` text NOT NULL,
	`room` text NOT NULL,
	`name` text NOT NULL,
	`pin` text NOT NULL,
	`checkin` integer NOT NULL,
	`checkout` integer NOT NULL,
	`active` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `stays_room` ON `stays` (`room`);--> statement-breakpoint
CREATE TABLE `visits` (
	`room` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`last` integer NOT NULL
);
