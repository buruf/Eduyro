// src/types/index.ts
// Eduyro — Global TypeScript Types

import type {
  User,
  Student,
  Parent,
  Teacher,
  School,
  Subject,
  Level,
  Skill,
  Worksheet,
  StudentProgress,
  CompletedSheet,
  PlacementTest,
  PdfExport,
  Subscription,
  Notification,
  Badge,
  StudentBadge,
} from "@prisma/client";

// ─────────────────────────────────────────────
// Re-exports from Prisma
// ─────────────────────────────────────────────
export type {
  User,
  Student,
  Parent,
  Teacher,
  School,
  Subject,
  Level,
  Skill,
  Worksheet,
  StudentProgress,
  CompletedSheet,
  PlacementTest,
  PdfExport,
  Subscription,
  Notification,
  Badge,
  StudentBadge,
};

// ─────────────────────────────────────────────
// Extended / Composed Types
// ─────────────────────────────────────────────

export type StudentWithUser = Student & {
  user: User;
};

export type StudentWithProgress = Student & {
  user: User;
  progress: (StudentProgress & {
    level: Level & { subject: Subject };
  })[];
};

export type ParentWithChildren = Parent & {
  user: User;
  children: {
    student: StudentWithProgress;
  }[];
};

export type TeacherWithSchool = Teacher & {
  user: User;
  school: School;
};

export type LevelWithSubject = Level & {
  subject: Subject;
  skills: Skill[];
};

export type WorksheetWithLevel = Worksheet & {
  level: Level & { subject: Subject };
  skill: Skill;
};

export type CompletedSheetWithWorksheet = CompletedSheet & {
  worksheet: WorksheetWithLevel;
};

export type ProgressWithLevel = StudentProgress & {
  level: LevelWithSubject;
};

// ─────────────────────────────────────────────
// Worksheet Problem Types
// ─────────────────────────────────────────────

export type ProblemType =
  | "arithmetic"       // 6 × 7 = ?
  | "fill_blank"       // 9 × __ = 63
  | "multiple_choice"
  | "short_answer"
  | "written_response"
  | "true_false"
  | "label_diagram"
  | "sentence_complete";

// How the student INPUTS an answer. The practice renderer keys off this to pick
// the right input component — it never guesses from the question text. Classified
// server-side (where the answer is known) so the client gets the type but not
// the answer.
export type AnswerType =
  | "integer"
  | "decimal"
  | "fraction"
  | "mixedFraction"
  | "percent"
  | "comparison"
  | "multipleChoice"
  | "trueFalse"
  | "expression"   // algebra: "5x", "3(x+4)" — keyboard text, sized (not a paragraph)
  | "text";        // short non-numeric fallback (sized input, never a paragraph)

export interface Problem {
  id: string;
  type: ProblemType;
  question: string;
  options?: string[];   // for multiple_choice
  answer: string | number;
  answerType?: AnswerType;
  points: number;
  hint?: string;
  explanation?: string;
}

export interface AnswerKeyEntry {
  id: string;           // matches Problem.id
  answer: string | number;
  explanation?: string;
  partialCredit?: boolean;
}

export interface GeneratedWorksheet {
  id: string;
  title: string;
  levelCode: string;
  levelName: string;
  subjectName: string;
  skillName: string;
  sheetNumber: number;
  totalSheets: number;
  timeLimitMinutes: number;
  problemCount: number;
  problems: Problem[];
  answerKey: AnswerKeyEntry[];
  type: "DAILY_PRACTICE" | "MASTERY_TEST" | "REVIEW" | "CHALLENGE";
}

// ─────────────────────────────────────────────
// Submission Types
// ─────────────────────────────────────────────

export interface SubmittedAnswer {
  problemId: string;
  answer: string | number;
  timeMs?: number;
}

export interface GradedAnswer {
  problemId: string;
  answer: string | number;
  correctAnswer: string | number;
  isCorrect: boolean;
  points: number;
  explanation?: string;
}

export interface SheetSubmission {
  worksheetId: string;
  studentId: string;
  answers: SubmittedAnswer[];
  timeSeconds: number;
}

export interface SheetResult {
  completedSheetId: string;
  score: number;
  totalProblems: number;
  accuracyPct: number;
  timeSeconds: number;
  gradedAnswers: GradedAnswer[];
  feedback: string;
  masteryStatus: {
    consecutivePassDays: number;
    daysUntilAdvance: number;
    isReadyToAdvance: boolean;
  };
}

// ─────────────────────────────────────────────
// Placement Test Types
// ─────────────────────────────────────────────

export interface PlacementQuestion {
  id: string;
  subjectSlug: string;
  levelCode: string;
  difficulty: number;   // 0.1 – 3.0
  question: string;
  options: string[];
  correctIndex: number;
  skillTag: string;
}

export interface PlacementAnswer {
  questionId: string;
  selectedIndex: number;
  timeMs: number;
}

export interface PlacementResult {
  subjectSlug: string;
  subjectName: string;
  assignedLevelCode: string;
  assignedLevelName: string;
  confidenceScore: number;  // 0-1
  correctCount: number;
  totalQuestions: number;
  accuracyPct: number;
}

// ─────────────────────────────────────────────
// Dashboard Types
// ─────────────────────────────────────────────

export interface StudentDashboard {
  student: StudentWithUser;
  streakDays: number;
  longestStreak: number;
  todayAccuracyPct: number | null;
  weeklyAccuracy: { date: string; pct: number }[];
  levelProgress: {
    levelCode: string;
    levelName: string;
    subjectName: string;
    sheetsCompleted: number;
    totalSheets: number;
    progressPct: number;
    consecutivePassDays: number;
    daysUntilAdvance: number;
    status: string;
  };
  todayPacket: TodayPacket;
  recentBadges: (StudentBadge & { badge: Badge })[];
  skillTree: SkillTreeNode[];
}

export interface TodayPacket {
  sheets: TodaySheet[];
  allComplete: boolean;
  canPrint: boolean;
}

export interface TodaySheet {
  index: number;       // 1, 2, 3
  worksheetId: string;
  title: string;
  skillName: string;
  problemCount: number;
  status: "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED";
  score?: number;
  accuracyPct?: number;
  timeSeconds?: number;
  completedAt?: string;
}

export interface SkillTreeNode {
  skillId: string;
  skillName: string;
  sortOrder: number;
  status: "MASTERED" | "IN_PROGRESS" | "LOCKED";
  progressPct: number;
  sheetsCompleted: number;
  totalSheets: number;
  // Item-level mastery (non-math skills): distinct questions seen vs. the bank,
  // and accuracy measured per distinct item. Omitted for MATH (unbounded items).
  itemsSeen?: number;
  itemsTotal?: number;
  itemsMastered?: number;
  itemAccuracyPct?: number;
}

export interface ParentDashboard {
  parent: ParentWithChildren;
  children: ChildSummary[];
  recentPdfs: PdfExport[];
  notifications: Notification[];
  subscription: Subscription | null;
}

export interface ChildSummary {
  student: StudentWithUser;
  currentLevel: LevelWithSubject | null;
  streakDays: number;
  todayAccuracyPct: number | null;
  weeklyCompletionRate: number;
  status: "EXCELLENT" | "ON_TRACK" | "NEEDS_REVIEW" | "NEEDS_SUPPORT";
  weakSkills: { skillName: string; accuracyPct: number }[];
  recentPdfs: PdfExport[];
  attendanceLastMonth: AttendanceDay[];
}

export interface AttendanceDay {
  date: string;
  status: "COMPLETE" | "MISSED" | "WEEKEND" | "UPCOMING";
}

export interface AdminDashboard {
  school: School;
  studentCount: number;
  teacherCount: number;
  avgAccuracyPct: number;
  sheetsThisWeek: number;
  levelAdvancesThisMonth: number;
  studentsNeedingSupport: StudentSummary[];
  recentExports: PdfExport[];
  weeklyAccuracyTrend: { date: string; pct: number }[];
  subjectBreakdown: { subject: string; accuracyPct: number }[];
}

export interface StudentSummary {
  student: StudentWithUser;
  currentLevel: LevelWithSubject | null;
  accuracyPct: number;
  streakDays: number;
  sheetsCompleted: number;
  status: "EXCELLENT" | "ON_TRACK" | "NEEDS_REVIEW" | "NEEDS_SUPPORT";
}

// ─────────────────────────────────────────────
// PDF Generation Types
// ─────────────────────────────────────────────

export interface PdfGenerationOptions {
  studentName?: string;
  date?: string;
  includeAnswerKey?: boolean;
  includeSignatureLine?: boolean;
  includeInstructions?: boolean;
  schoolBranding?: {
    schoolName: string;
    logoUrl?: string;
    headerText?: string;
    footerText?: string;
  };
  worksheetIds: string[];
}

// ─────────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, string[]>;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─────────────────────────────────────────────
// Auth Types
// ─────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  image: string | null;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "STUDENT" | "PARENT" | "TEACHER";
  grade?: string;
}

// ─────────────────────────────────────────────
// Stripe / Billing Types
// ─────────────────────────────────────────────

export interface CheckoutSessionInput {
  plan: "PREMIUM" | "SCHOOL_STARTER" | "SCHOOL_PLAN";
  quantity?: number;
  studentId?: string;
  schoolId?: string;
  successUrl: string;
  cancelUrl: string;
}
