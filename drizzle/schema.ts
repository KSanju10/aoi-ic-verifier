import { 
  int, 
  mysqlEnum, 
  mysqlTable, 
  text, 
  timestamp, 
  varchar,
  boolean,
  decimal,
  json,
  longtext
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * IC Verification Records Table
 * Stores information about uploaded IC images and their verification status
 */
export const icVerifications = mysqlTable("ic_verifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Foreign key to users table
  
  // IC Image and Storage
  imageUrl: text("imageUrl").notNull(), // S3 URL of uploaded IC image
  imageKey: varchar("imageKey", { length: 255 }).notNull(), // S3 key for the image
  fileName: varchar("fileName", { length: 255 }),
  mimeType: varchar("mimeType", { length: 64 }).default("image/jpeg"),
  
  // IC Type and Basic Info
  icType: mysqlEnum("icType", [
    "PAN",
    "AADHAAR",
    "VOTER_ID",
    "DRIVING_LICENSE",
    "PASSPORT",
    "OTHER"
  ]).notNull(),
  
  // Extracted Information (from OCR)
  extractedData: json("extractedData"), // JSON object with extracted text, name, ID number, etc.
  
  // Verification Status
  verificationStatus: mysqlEnum("verificationStatus", [
    "PENDING",
    "PROCESSING",
    "VERIFIED",
    "INVALID",
    "SUSPICIOUS",
    "FAILED"
  ]).default("PENDING").notNull(),
  
  // Verification Details
  isAuthentic: boolean("isAuthentic"), // Real or fake (authenticity check)
  isValid: boolean("isValid"), // Valid or invalid (expiry/format check)
  isTampered: boolean("isTampered"), // Not tampered (no fake edits)
  matchesDatabase: boolean("matchesDatabase"), // Matches with database information
  belongsToCorrectPerson: boolean("belongsToCorrectPerson"), // Belongs to correct person
  
  // Detailed Results
  verificationResults: json("verificationResults"), // Detailed verification results object
  
  // Forgery Detection
  blurDetected: boolean("blurDetected").default(false),
  qrCodeValid: boolean("qrCodeValid"),
  qrCodeData: text("qrCodeData"),
  fontMismatch: boolean("fontMismatch").default(false),
  
  // Confidence Scores
  authenticityScore: decimal("authenticityScore", { precision: 5, scale: 2 }), // 0-100
  validityScore: decimal("validityScore", { precision: 5, scale: 2 }), // 0-100
  overallConfidence: decimal("overallConfidence", { precision: 5, scale: 2 }), // 0-100
  
  // Metadata
  processingTime: int("processingTime"), // Time taken to process in milliseconds
  errorMessage: text("errorMessage"), // Error details if verification failed
  
  // Timestamps
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ICVerification = typeof icVerifications.$inferSelect;
export type InsertICVerification = typeof icVerifications.$inferInsert;

/**
 * IC Database Records Table
 * Stores reference IC information for cross-verification
 */
export const icDatabaseRecords = mysqlTable("ic_database_records", {
  id: int("id").autoincrement().primaryKey(),
  
  // IC Information
  icType: mysqlEnum("icType", [
    "PAN",
    "AADHAAR",
    "VOTER_ID",
    "DRIVING_LICENSE",
    "PASSPORT",
    "OTHER"
  ]).notNull(),
  
  icNumber: varchar("icNumber", { length: 64 }).notNull().unique(),
  holderName: varchar("holderName", { length: 255 }).notNull(),
  fatherName: varchar("fatherName", { length: 255 }),
  dateOfBirth: varchar("dateOfBirth", { length: 20 }),
  gender: mysqlEnum("gender", ["M", "F", "O"]),
  
  // Address Information
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  pincode: varchar("pincode", { length: 10 }),
  
  // Status
  isActive: boolean("isActive").default(true),
  isBlacklisted: boolean("isBlacklisted").default(false),
  blacklistReason: text("blacklistReason"),
  
  // Metadata
  issueDate: varchar("issueDate", { length: 20 }),
  expiryDate: varchar("expiryDate", { length: 20 }),
  issuingAuthority: varchar("issuingAuthority", { length: 255 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ICDatabaseRecord = typeof icDatabaseRecords.$inferSelect;
export type InsertICDatabaseRecord = typeof icDatabaseRecords.$inferInsert;

/**
 * Verification Logs Table
 * Maintains audit trail of all verification activities
 */
export const verificationLogs = mysqlTable("verification_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  verificationId: int("verificationId"),
  
  action: mysqlEnum("action", [
    "UPLOAD",
    "VERIFY",
    "VIEW_RESULT",
    "EXPORT",
    "DELETE",
    "ADMIN_REVIEW",
    "ADMIN_UPDATE"
  ]).notNull(),
  
  details: json("details"), // Additional context about the action
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VerificationLog = typeof verificationLogs.$inferSelect;
export type InsertVerificationLog = typeof verificationLogs.$inferInsert;

/**
 * Admin Settings Table
 * Stores configuration and settings for the verification system
 */
export const adminSettings = mysqlTable("admin_settings", {
  id: int("id").autoincrement().primaryKey(),
  
  settingKey: varchar("settingKey", { length: 100 }).notNull().unique(),
  settingValue: text("settingValue"),
  description: text("description"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdminSetting = typeof adminSettings.$inferSelect;
export type InsertAdminSetting = typeof adminSettings.$inferInsert;
