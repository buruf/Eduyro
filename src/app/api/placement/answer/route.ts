// src/app/api/placement/answer/route.ts
// FIX: Added totalQuestions to both the "continue" and "done" responses
// so the placement page progress bar shows the correct total instead of
// hardcoding 10 and showing "Question 11 of 10".
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  ok, notFound, err, handleRouteError, withAuth, parseRequest,
} from "@/lib/api/helpers";
import { AnswerPlacementSchema } from "@/lib/validation/schemas";
import {
  adjustDifficulty,
  calculateConfidence,
  ladderNext,
  calculateLadderPlacement,
  getQuestionById,
  PLACEMENT_CONSTANTS,
} from "@/lib/placement/engine";

export async function POST(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    const parsed = await parseRequest(req, AnswerPlacementSchema);
    if ("status" in parsed) return parsed;
    const { testId, questionId, selectedIndex, timeMs } = parsed.data;

    try {
      const test = await db.placementTest.findUnique({
        where: { id: testId },
        include: {
          student: { include: { user: true } },
        },
      });
      if (!test) return notFound("Placement test");
      if (test.student.userId !== ctx.userId) return err("Not your test", 403);
      if (test.status !== "IN_PROGRESS") return err("Test already complete", 400);

      const subject = await db.subject.findUnique({ where: { id: test.subjectId } });
      if (!subject) return err("Subject not found", 400);

      const question = getQuestionById(subject.slug, questionId);
      if (!question) return err("Question not found", 400);

      const isCorrect = selectedIndex === question.correctIndex;
      const newDifficulty = adjustDifficulty(test.currentDifficulty, isCorrect, question);
      const newQuestionsAsked = test.questionsAsked + 1;
      const newCorrectAnswers = test.correctAnswers + (isCorrect ? 1 : 0);
      const confidence = calculateConfidence(newQuestionsAsked, newCorrectAnswers, newDifficulty);

      const log = (test.questionLog as any[]) || [];
      log.push({
        questionId,
        question: question.question,
        selectedIndex,
        correctIndex: question.correctIndex,
        correct: isCorrect,
        difficulty: question.difficulty,
        levelCode: question.levelCode,
        timeMs,
      });

      // LADDER (v2): the next step — or the finished placement — is recomputed
      // statelessly from the full answer log (see ladderNext in the engine).
      const step = ladderNext(subject.slug, log);

      if (step.done) {
        const placement = await calculateLadderPlacement(
          subject.slug,
          step.comfortableLevelCode,
          newCorrectAnswers,
          newQuestionsAsked
        );

        const resultLevel = await db.level.findFirst({
          where: { subjectId: subject.id, code: placement.assignedLevelCode },
        });

        await db.placementTest.update({
          where: { id: testId },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            currentDifficulty: newDifficulty,
            questionsAsked: newQuestionsAsked,
            correctAnswers: newCorrectAnswers,
            confidenceScore: confidence,
            placementPct: placement.accuracyPct,
            resultLevelId: resultLevel?.id,
            resultLevelCode: placement.assignedLevelCode,
            questionLog: log,
          },
        });

        if (resultLevel) {
          await db.studentProgress.upsert({
            where: {
              studentId_levelId: {
                studentId: test.studentId,
                levelId: resultLevel.id,
              },
            },
            create: {
              studentId: test.studentId,
              levelId: resultLevel.id,
              status: "IN_PROGRESS",
              startedAt: new Date(),
            },
            update: {
              status: "IN_PROGRESS",
              startedAt: new Date(),
            },
          });
        }

        const remainingTests = await db.placementTest.findMany({
          where: {
            studentId: test.studentId,
            status: "IN_PROGRESS",
          },
          include: {},
          orderBy: { startedAt: "asc" },
        });

        if (remainingTests.length === 0) {
          await db.notification.create({
            data: {
              userId: test.student.userId,
              type: "PLACEMENT_COMPLETE",
              title: "Placement test complete!",
              message: `You've been placed at Level ${placement.assignedLevelCode} in ${placement.subjectName}.`,
            },
          });
        }

        return ok({
          done: true,
          isCorrect,
          correctAnswer: question.options[question.correctIndex],
          result: placement,
          nextTestId: remainingTests[0]?.id ?? null,
          // FIX: include totalQuestions so progress bar is accurate
          totalQuestions: newQuestionsAsked,
        });
      }

      // Continue — the ladder already chose the next question (an exhausted bank
      // returns done above, so no forced-termination path is needed).
      const nextQuestion = step.question;

      await db.placementTest.update({
        where: { id: testId },
        data: {
          currentDifficulty: newDifficulty,
          questionsAsked: newQuestionsAsked,
          correctAnswers: newCorrectAnswers,
          confidenceScore: confidence,
          questionLog: log,
        },
      });

      // FIX: totalQuestions is the max possible questions for this subject.
      // We send MAX_QUESTIONS_PER_SUBJECT so the progress bar shows
      // "Question 3 of 12" instead of "Question 3 of 10".
      // If the test ends early (high confidence), the bar will just
      // show the final question number out of max — which is fine.
      return ok({
        done: false,
        isCorrect,
        correctAnswer: question.options[question.correctIndex],
        question: nextQuestion
          ? {
              id: nextQuestion.id,
              question: nextQuestion.question,
              options: nextQuestion.options,
              difficulty: nextQuestion.difficulty,
              levelCode: nextQuestion.levelCode,
            }
          : null,
        questionNumber: newQuestionsAsked + 1,
        totalQuestions: PLACEMENT_CONSTANTS.MAX_QUESTIONS_PER_SUBJECT,
      });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
