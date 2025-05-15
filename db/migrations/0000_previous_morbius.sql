CREATE TABLE `RouteShiftInfo` (
	`id` text PRIMARY KEY NOT NULL,
	`organizationID` text,
	`routeId` text NOT NULL,
	`shiftName` text NOT NULL,
	`startTime` text NOT NULL,
	`endTime` text NOT NULL,
	`dateAddedToCB` text NOT NULL,
	FOREIGN KEY (`routeId`) REFERENCES `Routes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Routes` (
	`id` text PRIMARY KEY NOT NULL,
	`organizationID` text,
	`routeNiceName` text NOT NULL,
	`routeIDFromPostOffice` text,
	`dateRouteAcquired` text NOT NULL,
	`dateAddedToCB` text NOT NULL,
	`img` text
);
--> statement-breakpoint
CREATE TABLE `Users` (
	`id` text PRIMARY KEY NOT NULL,
	`clerkID` text,
	`organizationID` text,
	`userNiceName` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`dateHired` text NOT NULL,
	`dateAddedToCB` text NOT NULL,
	`img` text
);
--> statement-breakpoint
CREATE TABLE `WorkTimeShift` (
	`id` text PRIMARY KEY NOT NULL,
	`organizationID` text,
	`occupied` integer DEFAULT false NOT NULL,
	`userId` text NOT NULL,
	`shiftWorked` text NOT NULL,
	`dayScheduled` text NOT NULL,
	`dateAddedToCB` text NOT NULL,
	`routeId` text NOT NULL,
	`summary` text DEFAULT '{}',
	FOREIGN KEY (`shiftWorked`) REFERENCES `RouteShiftInfo`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`routeId`) REFERENCES `Routes`(`id`) ON UPDATE no action ON DELETE no action
);
