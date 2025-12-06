CREATE TABLE `admin_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingKey` varchar(100) NOT NULL,
	`settingValue` text,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_settings_settingKey_unique` UNIQUE(`settingKey`)
);
--> statement-breakpoint
CREATE TABLE `ic_database_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`icType` enum('PAN','AADHAAR','VOTER_ID','DRIVING_LICENSE','PASSPORT','OTHER') NOT NULL,
	`icNumber` varchar(64) NOT NULL,
	`holderName` varchar(255) NOT NULL,
	`fatherName` varchar(255),
	`dateOfBirth` varchar(20),
	`gender` enum('M','F','O'),
	`address` text,
	`city` varchar(100),
	`state` varchar(100),
	`pincode` varchar(10),
	`isActive` boolean DEFAULT true,
	`isBlacklisted` boolean DEFAULT false,
	`blacklistReason` text,
	`issueDate` varchar(20),
	`expiryDate` varchar(20),
	`issuingAuthority` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ic_database_records_id` PRIMARY KEY(`id`),
	CONSTRAINT `ic_database_records_icNumber_unique` UNIQUE(`icNumber`)
);
--> statement-breakpoint
CREATE TABLE `ic_verifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`imageKey` varchar(255) NOT NULL,
	`fileName` varchar(255),
	`mimeType` varchar(64) DEFAULT 'image/jpeg',
	`icType` enum('PAN','AADHAAR','VOTER_ID','DRIVING_LICENSE','PASSPORT','OTHER') NOT NULL,
	`extractedData` json,
	`verificationStatus` enum('PENDING','PROCESSING','VERIFIED','INVALID','SUSPICIOUS','FAILED') NOT NULL DEFAULT 'PENDING',
	`isAuthentic` boolean,
	`isValid` boolean,
	`isTampered` boolean,
	`matchesDatabase` boolean,
	`belongsToCorrectPerson` boolean,
	`verificationResults` json,
	`blurDetected` boolean DEFAULT false,
	`qrCodeValid` boolean,
	`qrCodeData` text,
	`fontMismatch` boolean DEFAULT false,
	`authenticityScore` decimal(5,2),
	`validityScore` decimal(5,2),
	`overallConfidence` decimal(5,2),
	`processingTime` int,
	`errorMessage` text,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ic_verifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `verification_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`verificationId` int,
	`action` enum('UPLOAD','VERIFY','VIEW_RESULT','EXPORT','DELETE','ADMIN_REVIEW','ADMIN_UPDATE') NOT NULL,
	`details` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `verification_logs_id` PRIMARY KEY(`id`)
);
