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
  | "point"        // a coordinate (x,y) placed on an interactive plane (drag/plot)
  | "ordering"     // drag/reorder a set of items; answer = the chosen order joined by commas
  | "multiSelect"  // select ALL that apply; answer = the chosen subset, sorted + comma-joined
  | "text";        // short non-numeric fallback (sized input, never a paragraph)

// Spec for an interactive (graphing) question. Sent to the client to RENDER the
// plane; it never contains the answer (the target lives only in the answer key).
export interface InteractiveSpec {
  // "vertex-drag": drag a parabola's vertex (the curve follows the point).
  // "plot-point":  drag a single point to a target (optionally reading it off a
  //                read-only reference curve, e.g. plotting the y-intercept).
  // "plot-line": drag two points; the line through them is graded by canonical
  //              slope+intercept ("m,b"), so any two correct lattice points match.
  // "equation-builder": a line is shown; the student BUILDS its equation by
  //              selecting slope & intercept (graded "m,b").
  // "angle-drag": drag a point around the unit circle to a target angle; it
  //              snaps to standard angles and is graded by the degree value.
  // "area-model": fill the four regions of the (x+a)(x+b) area model (dropdowns);
  //              graded by the four partial products joined.
  // "triangle-drag": drag a triangle's three vertices to a target/image figure;
  //              graded by the (order-independent) set of vertices.
  kind: "vertex-drag" | "plot-point" | "plot-line" | "equation-builder" | "angle-drag" | "area-model" | "triangle-drag";
  a?: number;                   // vertex-drag: fixed leading coefficient (curve shape)
  curve?: { a: number; h: number; k: number }; // plot-point: optional read-only parabola y=a(x−h)²+k
  line?: { m: number; b: number };              // equation-builder: the shown line y = mx + b
  binomial?: { a: number; b: number };          // area-model: the product (x+a)(x+b)
  xRange: [number, number];
  yRange: [number, number];
  snap: number;                 // grid snap step, e.g. 0.5
}

export interface Problem {
  id: string;
  type: ProblemType;
  question: string;
  options?: string[];   // for multiple_choice
  answer: string | number;
  answerType?: AnswerType;
  interactive?: InteractiveSpec; // present for graphing items (answerType "point")
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
  // Per-problem first-try correctness (client-computed, retry-till-right
  // practice). Optional — absent for paper submissions/unanswered problems.
  firstTry?: boolean;
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
    status: string;
    progressPct: number;
    // Skill-map progression (one lesson per day, advance on ≥95% daily avg):
    currentSkillIndex: number;
    currentSkillName: string;
    totalSkills: number;
    skillsMastered: number;
    todayDone: number;
    todayNeeded: number;
    todayAvgPct: number;
    // The level's real bar + fact-pace target, so the UI never hard-codes them.
    thresholdPct?: number;
    paceTargetSec?: number | null;
    // Accurate enough but too slow on fact sheets → the lesson repeats.
    slowToday?: boolean;
    dayCleared: boolean;
    sheetsToAdvance: number;
    isReadyToAdvance: boolean;
    currentSkill: string;
  } | null;
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
  /** Plain-language "what happened today / what happens tomorrow" — advance vs
   *  repeat vs still-working, with the current lesson's name and position. */
  todayStory?: {
    subjectName: string | null;
    doneToday: number;
    perDay: number;
    avgToday: number | null;
    bar: number;
    outcome: "working" | "repeat" | "advance";
    lessonLabel: string | null;
    lessonPos: number | null;
    lessonTotal: number | null;
    nextLessonLabel: string | null;
  } | null;
  recentPdfs: PdfExport[];
  attendanceLastMonth: AttendanceDay[];
  // 10-section parent dashboard data
  recentSheets?: { completedAt: string | Date; title: string; skillName: string; levelCode: string; accuracyPct: number; timeSeconds: number | null }[];
  badges?: { earnedAt: string | Date; name: string; description: string; iconEmoji: string }[];
  goals?: { sheetsPerDay: number; masteryThresholdPct: number; streakDays: number; bestStreak: number };
  learningPath?: { levelCode: string; levelName: string; currentIndex: number; lessons: string[] } | null;
}

export interface AttendanceDay {
  date: string;
  status: "COMPLETE" | "MISSED" | "WEEKEND" | "UPCOMING" | "EXCUSED";
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
