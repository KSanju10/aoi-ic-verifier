import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  icVerifications,
  InsertICVerification,
  ICVerification,
  icDatabaseRecords,
  InsertICDatabaseRecord,
  ICDatabaseRecord,
  verificationLogs,
  InsertVerificationLog,
  adminSettings,
  InsertAdminSetting
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// USER OPERATIONS
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// IC VERIFICATION OPERATIONS
// ============================================================================

export async function createICVerification(data: InsertICVerification): Promise<ICVerification> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(icVerifications).values(data);
  const verificationId = result[0].insertId;
  
  const verification = await db
    .select()
    .from(icVerifications)
    .where(eq(icVerifications.id, Number(verificationId)))
    .limit(1);

  if (!verification.length) {
    throw new Error("Failed to create IC verification");
  }

  return verification[0];
}

export async function getICVerificationById(id: number): Promise<ICVerification | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get verification: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(icVerifications)
    .where(eq(icVerifications.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserICVerifications(userId: number, limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get verifications: database not available");
    return [];
  }

  return await db
    .select()
    .from(icVerifications)
    .where(eq(icVerifications.userId, userId))
    .orderBy(desc(icVerifications.uploadedAt))
    .limit(limit)
    .offset(offset);
}

export async function updateICVerification(
  id: number,
  data: Partial<InsertICVerification>
): Promise<ICVerification | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update verification: database not available");
    return undefined;
  }

  await db
    .update(icVerifications)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(icVerifications.id, id));

  return getICVerificationById(id);
}

export async function deleteICVerification(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete verification: database not available");
    return false;
  }

  await db.delete(icVerifications).where(eq(icVerifications.id, id));
  return true;
}

// ============================================================================
// IC DATABASE RECORD OPERATIONS
// ============================================================================

export async function createICDatabaseRecord(data: InsertICDatabaseRecord): Promise<ICDatabaseRecord> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(icDatabaseRecords).values(data);
  const recordId = result[0].insertId;

  const record = await db
    .select()
    .from(icDatabaseRecords)
    .where(eq(icDatabaseRecords.id, Number(recordId)))
    .limit(1);

  if (!record.length) {
    throw new Error("Failed to create IC database record");
  }

  return record[0];
}

export async function getICDatabaseRecordByNumber(icNumber: string): Promise<ICDatabaseRecord | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get IC record: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(icDatabaseRecords)
    .where(eq(icDatabaseRecords.icNumber, icNumber))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function searchICDatabaseRecords(query: string, limit: number = 20) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot search IC records: database not available");
    return [];
  }

  // Simple search by IC number or holder name
  return await db
    .select()
    .from(icDatabaseRecords)
    .where(
      and(
        eq(icDatabaseRecords.isActive, true),
        eq(icDatabaseRecords.isBlacklisted, false)
      )
    )
    .limit(limit);
}

// ============================================================================
// VERIFICATION LOG OPERATIONS
// ============================================================================

export async function createVerificationLog(data: InsertVerificationLog): Promise<VerificationLog> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(verificationLogs).values(data);
  const logId = result[0].insertId;

  const log = await db
    .select()
    .from(verificationLogs)
    .where(eq(verificationLogs.id, Number(logId)))
    .limit(1);

  if (!log.length) {
    throw new Error("Failed to create verification log");
  }

  return log[0];
}

export async function getUserVerificationLogs(userId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get logs: database not available");
    return [];
  }

  return await db
    .select()
    .from(verificationLogs)
    .where(eq(verificationLogs.userId, userId))
    .orderBy(desc(verificationLogs.createdAt))
    .limit(limit);
}

// ============================================================================
// ADMIN SETTINGS OPERATIONS
// ============================================================================

export async function getAdminSetting(key: string): Promise<AdminSetting | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get setting: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(adminSettings)
    .where(eq(adminSettings.settingKey, key))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function setAdminSetting(key: string, value: string, description?: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot set setting: database not available");
    return;
  }

  const existing = await getAdminSetting(key);

  if (existing) {
    await db
      .update(adminSettings)
      .set({ settingValue: value, description })
      .where(eq(adminSettings.settingKey, key));
  } else {
    await db.insert(adminSettings).values({
      settingKey: key,
      settingValue: value,
      description,
    });
  }
}

// ============================================================================
// ADMIN STATISTICS OPERATIONS
// ============================================================================

export async function getVerificationStats() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get stats: database not available");
    return null;
  }

  const allVerifications = await db.select().from(icVerifications);
  
  const stats = {
    totalVerifications: allVerifications.length,
    verified: allVerifications.filter(v => v.verificationStatus === "VERIFIED").length,
    invalid: allVerifications.filter(v => v.verificationStatus === "INVALID").length,
    suspicious: allVerifications.filter(v => v.verificationStatus === "SUSPICIOUS").length,
    pending: allVerifications.filter(v => v.verificationStatus === "PENDING").length,
    failed: allVerifications.filter(v => v.verificationStatus === "FAILED").length,
  };

  return stats;
}

// Type exports for verification logs
export type VerificationLog = typeof verificationLogs.$inferSelect;
export type AdminSetting = typeof adminSettings.$inferSelect;
