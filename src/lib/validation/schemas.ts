// src/lib/validation/schemas.ts
// Zod validation schemas for every API input

import { z } from "zod";

// ─────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  role: z.enum(["STUDENT", "PARENT", "TEACHER"]).default("STUDENT"),
  grade: z.string().optional(),
  dateOfBirth: z.string().optional(),
  // Worldwide compliance: affirmative, un-ticked-by-default acceptance of the
  // current Terms & Privacy Policy is required to create an account.
  acceptedTerms: z.literal(true, { errorMap: () => ({ message: "You must accept the Terms of Service and Privacy Policy" }) }),
  // Optional client-provided country fallback (ISO alpha-2); server prefers geo header.
  countryCode: z.string().length(2).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
});

// ─────────────────────────────────────────────
// Students
// ─────────────────────────────────────────────

export const UpdateStudentSchema = z.object({
  grade: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
});

export const SubmitSheetSchema = z.object({
  worksheetId: z.string().cuid("Invalid worksheet ID"),
  answers: z
    .array(
      z.object({
        problemId: z.string(),
        answer: z.union([z.string(), z.number()]),
        timeMs: z.number().optional(),
      })
    )
    .min(1, "No answers submitted"),
  // Wall-clock elapsed time. A student can leave the modal open for hours, so we
  // accept any non-negative value and CLAMP it in the handler rather than
  // rejecting the whole submission — a long idle session must never discard
  // correct work. (Recorded time is for stats/badges only, not grading.)
  timeSeconds: z.number().min(0),
  // Interactive practice uses retry-till-right, so the FINAL answers are all
  // correct. The client sends the honest FIRST-TRY accuracy (the real fluency
  // signal) so mastery isn't trivially satisfied by retrying. Omitted for paper
  // submissions (there, final == first try).
  firstTryAccuracyPct: z.number().min(0).max(100).optional(),
});

// ─────────────────────────────────────────────
// Placement Test
// ─────────────────────────────────────────────

export const StartPlacementSchema = z.object({
  subjectSlugs: z
    .array(z.enum(["MATH", "READING", "WRITING", "SCIENCE"]))
    .min(1, "Select at least one subject"),
});

export const AnswerPlacementSchema = z.object({
  testId: z.string().cuid(),
  questionId: z.string(),
  selectedIndex: z.number().int().min(-1).max(3), // -1 = "I'm not sure" (scored incorrect, no guess-inflation)
  timeMs: z.number().min(0),
});

// ─────────────────────────────────────────────
// PDF
// ─────────────────────────────────────────────

export const GeneratePdfSchema = z.object({
  studentId: z.string().cuid(),
  worksheetIds: z.array(z.string().cuid()).min(1).max(20),
  includeAnswerKey: z.boolean().default(true),
  includeSignatureLine: z.boolean().default(true),
  includeInstructions: z.boolean().default(true),
});

export const BulkExportSchema = z.object({
  schoolId: z.string().cuid(),
  exportType: z.enum([
    "TODAY",
    "THIS_WEEK",
    "MASTERY_TEST",
    "CUSTOM",
  ]),
  classFilter: z.string().optional(), // teacher ID or "ALL"
  includeAnswerKey: z.boolean().default(true),
  outputFormat: z.enum(["ONE_PER_STUDENT", "ONE_PER_CLASS", "MERGED"]).default("ONE_PER_STUDENT"),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

// ─────────────────────────────────────────────
// Curriculum (Admin)
// ─────────────────────────────────────────────

export const CreateLevelSchema = z.object({
  subjectId: z.string().cuid(),
  code: z.string().min(1).max(10).toUpperCase(),
  name: z.string().min(1).max(100),
  gradeMin: z.string(),
  gradeMax: z.string(),
  description: z.string().optional(),
  sortOrder: z.number().int().min(0),
  masteryThresholdPct: z.number().int().min(50).max(100).default(95),
  masteryConsecutiveDays: z.number().int().min(1).max(14).default(5),
  sheetsPerDay: z.number().int().min(1).max(10).default(3),
  problemsPerSheet: z.number().int().min(5).max(40).default(20),
  timeLimitMinutes: z.number().int().min(3).max(60).default(10),
});

export const CreateSkillSchema = z.object({
  levelId: z.string().cuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  sortOrder: z.number().int().min(0),
  totalSheets: z.number().int().min(10).max(500).default(40),
});

export const GenerateWorksheetsSchema = z.object({
  subjectSlug: z.enum(["MATH", "READING", "WRITING", "SCIENCE"]),
  levelCode: z.string(),
  skillId: z.string().cuid().optional(),
  sheetCount: z.number().int().min(1).max(10).default(3),
  problemCount: z.number().int().min(5).max(40).default(20),
  timeLimitMinutes: z.number().int().min(3).max(60).default(10),
  studentName: z.string().optional(),
  includeAnswerKey: z.boolean().default(true),
});

// ─────────────────────────────────────────────
// School (Admin)
// ─────────────────────────────────────────────

export const CreateSchoolSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  contactEmail: z.string().email(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  country: z.string().default("CA"),
});

export const UpdateSchoolBrandingSchema = z.object({
  worksheetHeaderText: z.string().max(100).optional(),
  worksheetFooterText: z.string().max(200).optional(),
  worksheetLogoUrl: z.string().url().optional(),
});

export const BulkImportStudentsSchema = z.object({
  schoolId: z.string().cuid(),
  students: z
    .array(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        grade: z.string().optional(),
        teacherEmail: z.string().email().optional(),
      })
    )
    .min(1)
    .max(500),
});

// ─────────────────────────────────────────────
// Checkout / Billing
// ─────────────────────────────────────────────

export const CheckoutSchema = z.object({
  plan: z.enum(["PREMIUM", "SCHOOL_STARTER", "SCHOOL_PLAN", "DISTRICT"]),
  quantity: z.number().int().min(1).optional(),
  studentId: z.string().cuid().optional(),
  schoolId: z.string().cuid().optional(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

// ─────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────

export const MarkNotificationReadSchema = z.object({
  notificationIds: z.array(z.string().cuid()).min(1),
});

// ─────────────────────────────────────────────
// Utility: parse + return typed errors
// ─────────────────────────────────────────────

export function parseBody<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { data: T; error: null } | { data: null; error: Record<string, string[]> } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { data: result.data, error: null };
  }
  const fieldErrors: Record<string, string[]> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join(".");
    if (!fieldErrors[path]) fieldErrors[path] = [];
    fieldErrors[path].push(err.message);
  });
  return { data: null, error: fieldErrors };
}
