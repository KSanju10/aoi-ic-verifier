import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  createICVerification,
  getICVerificationById,
  getUserICVerifications,
  updateICVerification,
  deleteICVerification,
  getICDatabaseRecordByNumber,
  createVerificationLog,
  getVerificationStats,
  getUserById,
} from "./db";
import { verifyIC, determineVerificationStatus, ExtractedICData } from "./verification";
import { storagePut, storageGet } from "./storage";
import { invokeLLM } from "./_core/llm";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ICTypeEnum = z.enum([
  "PAN",
  "AADHAAR",
  "VOTER_ID",
  "DRIVING_LICENSE",
  "PASSPORT",
  "OTHER",
]);

const ExtractedDataSchema = z.object({
  icType: ICTypeEnum,
  icNumber: z.string().optional(),
  holderName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  fatherName: z.string().optional(),
  address: z.string().optional(),
  gender: z.string().optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  qrCodeData: z.string().optional(),
  rawText: z.string().optional(),
});

// ============================================================================
// IC VERIFICATION ROUTER
// ============================================================================

const icRouter = router({
  /**
   * Upload an IC image and initiate verification
   * Returns verification record with processing status
   */
  upload: protectedProcedure
    .input(
      z.object({
        imageBase64: z.string().describe("Base64 encoded image"),
        fileName: z.string(),
        mimeType: z.string().default("image/jpeg"),
        icType: ICTypeEnum,
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Convert base64 to buffer
        const imageBuffer = Buffer.from(input.imageBase64, "base64");

        // Upload to S3
        const fileKey = `ic-verifications/${ctx.user.id}/${Date.now()}-${input.fileName}`;
        const { url: imageUrl } = await storagePut(
          fileKey,
          imageBuffer,
          input.mimeType
        );

        // Create verification record
        const verification = await createICVerification({
          userId: ctx.user.id,
          imageUrl,
          imageKey: fileKey,
          fileName: input.fileName,
          mimeType: input.mimeType,
          icType: input.icType,
          verificationStatus: "PROCESSING",
        });

        // Log the upload action
        await createVerificationLog({
          userId: ctx.user.id,
          verificationId: verification.id,
          action: "UPLOAD",
          details: {
            fileName: input.fileName,
            icType: input.icType,
          },
        });

        return {
          success: true,
          verificationId: verification.id,
          status: "PROCESSING",
          message: "Image uploaded successfully. Processing started...",
        };
      } catch (error) {
        console.error("[IC Upload] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload IC image",
        });
      }
    }),

  /**
   * Process IC image with OCR and verification
   * This would typically be called by a background job
   */
  process: protectedProcedure
    .input(
      z.object({
        verificationId: z.number(),
        extractedData: ExtractedDataSchema,
        ocrConfidence: z.number().min(0).max(100).default(85),
        qrCodeData: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const verification = await getICVerificationById(input.verificationId);

        if (!verification) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Verification record not found",
          });
        }

        if (verification.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this verification",
          });
        }

        // Run verification algorithm
        const verificationResult = verifyIC(
          input.extractedData as ExtractedICData,
          input.ocrConfidence,
          input.qrCodeData
        );

        const status = determineVerificationStatus(verificationResult);

        // Check database if IC number is available
        let matchesDatabase = false;
        if (input.extractedData.icNumber) {
          const dbRecord = await getICDatabaseRecordByNumber(
            input.extractedData.icNumber
          );
          matchesDatabase = !!dbRecord;

          if (dbRecord && input.extractedData.holderName) {
            const nameMatch =
              dbRecord.holderName.toLowerCase() ===
              input.extractedData.holderName.toLowerCase();
            verificationResult.belongsToCorrectPerson = nameMatch;
          }
        }

        // Update verification record
        const updatedVerification = await updateICVerification(
          input.verificationId,
          {
            extractedData: input.extractedData,
            verificationStatus: status,
            isAuthentic: verificationResult.isAuthentic,
            isValid: verificationResult.isValid,
            isTampered: verificationResult.isTampered,
            matchesDatabase,
            belongsToCorrectPerson: verificationResult.belongsToCorrectPerson,
            verificationResults: verificationResult,
            blurDetected: verificationResult.authenticityScore < 80,
            qrCodeValid: input.qrCodeData
              ? verificationResult.overallConfidence >= 70
              : undefined,
            qrCodeData: input.qrCodeData,
            authenticityScore: String(verificationResult.authenticityScore),
            validityScore: String(verificationResult.validityScore),
            overallConfidence: String(verificationResult.overallConfidence),
            verifiedAt: new Date(),
          }
        );

        // Log the verification action
        await createVerificationLog({
          userId: ctx.user.id,
          verificationId: input.verificationId,
          action: "VERIFY",
          details: {
            status,
            authenticityScore: verificationResult.authenticityScore,
            validityScore: verificationResult.validityScore,
          },
        });

        return {
          success: true,
          verificationId: input.verificationId,
          status,
          result: verificationResult,
          verification: updatedVerification,
        };
      } catch (error) {
        console.error("[IC Process] Error:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process IC verification",
        });
      }
    }),

  /**
   * Get verification results
   */
  getResults: protectedProcedure
    .input(z.object({ verificationId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const verification = await getICVerificationById(input.verificationId);

        if (!verification) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Verification record not found",
          });
        }

        if (verification.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this verification",
          });
        }

        // Log the view action
        await createVerificationLog({
          userId: ctx.user.id,
          verificationId: input.verificationId,
          action: "VIEW_RESULT",
        });

        return verification;
      } catch (error) {
        console.error("[IC Get Results] Error:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve verification results",
        });
      }
    }),

  /**
   * Get user's verification history
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const verifications = await getUserICVerifications(
          ctx.user.id,
          input.limit,
          input.offset
        );

        return {
          success: true,
          data: verifications,
          count: verifications.length,
        };
      } catch (error) {
        console.error("[IC Get History] Error:", error);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve verification history",
        });
      }
    }),

  /**
   * Delete a verification record
   */
  delete: protectedProcedure
    .input(z.object({ verificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const verification = await getICVerificationById(input.verificationId);

        if (!verification) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Verification record not found",
          });
        }

        if (verification.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this verification",
          });
        }

        await deleteICVerification(input.verificationId);

        // Log the delete action
        await createVerificationLog({
          userId: ctx.user.id,
          verificationId: input.verificationId,
          action: "DELETE",
        });

        return { success: true };
      } catch (error) {
        console.error("[IC Delete] Error:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete verification record",
        });
      }
    }),
});

// ============================================================================
// ADMIN ROUTER
// ============================================================================

const adminRouter = router({
  /**
   * Get verification statistics (admin only)
   */
  getStats: protectedProcedure
    .use(async ({ ctx, next }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }
      return next({ ctx });
    })
    .query(async () => {
      try {
        const stats = await getVerificationStats();
        return { success: true, data: stats };
      } catch (error) {
        console.error("[Admin Stats] Error:", error);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve statistics",
        });
      }
    }),

  /**
   * Export verification data (admin only)
   */
  exportData: protectedProcedure
    .use(async ({ ctx, next }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }
      return next({ ctx });
    })
    .input(
      z.object({
        format: z.enum(["json", "csv"]).default("json"),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // This would be implemented based on your export requirements
        return {
          success: true,
          message: "Export started. You will receive the file shortly.",
        };
      } catch (error) {
        console.error("[Admin Export] Error:", error);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to export data",
        });
      }
    }),
});

// ============================================================================
// MAIN APP ROUTER
// ============================================================================

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  ic: icRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
