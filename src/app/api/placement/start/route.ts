// src/app/api/placement/start/route.ts
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  ok, notFound, err, handleRouteError, withAuth, parseRequest,
} from "@/lib/api/helpers";
import { StartPlacementSchema } from "@/lib/validation/schemas";
import { ladderNext } from "@/lib/placement/engine";
import { enabledSubjectSlugs } from "@/lib/enrollment";

export async function POST(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    const parsed = await parseRequest(req, StartPlacementSchema);
    if ("status" in parsed) return parsed;
    const { subjectSlugs } = parsed.data;

    try {
      const student = await db.student.findUnique({ where: { userId: ctx.userId } });
      if (!student) return notFound("Student profile");

      // Enforce parent-controlled enrollment: a child may ONLY take placement in
      // subjects the parent has enabled. This blocks self-provisioning even if a
      // request is crafted directly against the API.
      const enabled = await enabledSubjectSlugs(student.id);
      const allowedSlugs = (subjectSlugs as string[]).filter((s) => enabled.has(s as any));
      if (allowedSlugs.length === 0) {
        return err("This subject isn't enabled for this student. Ask your parent to turn it on.", 403);
      }

      // Find subjects in DB (only the allowed ones)
      const subjects = await db.subject.findMany({
        where: { slug: { in: allowedSlugs as any[] }, isPublic: true },
      });
      if (!subjects.length) return err("Invalid subjects", 400);

      // Create one PlacementTest per subject in order
      const tests = await Promise.all(
        subjects.map(async (subject) => {
          // Cancel any existing in-progress tests for this subject
          await db.placementTest.updateMany({
            where: {
              studentId: student.id,
              subjectId: subject.id,
              status: "IN_PROGRESS",
            },
            data: { status: "ABANDONED" },
          });

          return db.placementTest.create({
            data: {
              studentId: student.id,
              subjectId: subject.id,
              status: "IN_PROGRESS",
              // LADDER (v2): the test starts at the very EASIEST level and climbs.
              currentDifficulty: 0.1,
              questionsAsked: 0,
              correctAnswers: 0,
              questionLog: [],
            },
          });
        })
      );

      const firstTest = tests[0];
      const firstSubject = subjects.find((s) => s.id === firstTest.subjectId);
      const firstStep = ladderNext(firstSubject!.slug, []);
      const firstQuestion = firstStep.done ? null : firstStep.question;

      return ok({
        testId: firstTest.id,
        subjectSlug: firstSubject!.slug,
        subjectName: firstSubject!.name,
        totalTests: tests.length,
        currentTestIndex: 0,
        question: firstQuestion
          ? {
              id: firstQuestion.id,
              question: firstQuestion.question,
              options: firstQuestion.options,
              difficulty: firstQuestion.difficulty,
              levelCode: firstQuestion.levelCode,
            }
          : null,
        questionNumber: 1,
        maxQuestions: 25,
      });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
