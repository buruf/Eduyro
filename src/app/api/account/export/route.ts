// src/app/api/account/export/route.ts
// GET — self-service DATA EXPORT (data-subject access/portability right:
// GDPR Art. 15/20, PIPEDA, CCPA, Australia/NZ Privacy Acts, APPI, PIPA, PIPL).
// Returns a JSON download of everything we hold for the signed-in user:
// account, parent profile, children (profiles, progress, completed-sheet
// history), consents, subscription, and shop purchases under their email.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notFound, handleRouteError, withAuth } from "@/lib/api/helpers";

export async function GET(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    try {
      const user = await db.user.findUnique({
        where: { id: ctx.userId },
        select: {
          id: true, email: true, name: true, role: true, createdAt: true, emailVerified: true,
          subscription: { select: { plan: true, status: true, currentPeriodEnd: true, createdAt: true } },
        },
      });
      if (!user) return notFound("User");

      // Parent → children (profiles + learning history)
      const parent = await db.parent.findFirst({
        where: { userId: user.id },
        select: {
          id: true,
          children: {
            select: {
              student: {
                select: {
                  id: true, grade: true, dateOfBirth: true, timezone: true, createdAt: true,
                  user: { select: { name: true, email: true } },
                  progress: { select: { status: true, sheetsCompleted: true, lastAccuracyPct: true, currentSkillIndex: true, level: { select: { code: true, name: true, subject: { select: { name: true } } } } } },
                  completedSheets: {
                    orderBy: { completedAt: "desc" },
                    select: { completedAt: true, score: true, totalProblems: true, accuracyPct: true, timeSeconds: true, worksheet: { select: { title: true } } },
                  },
                },
              },
            },
          },
        },
      });

      // Student's own data (when the signed-in user IS a student)
      const ownStudent = await db.student.findUnique({
        where: { userId: user.id },
        select: {
          id: true, grade: true, dateOfBirth: true, timezone: true, createdAt: true,
          progress: { select: { status: true, sheetsCompleted: true, lastAccuracyPct: true, level: { select: { code: true, name: true } } } },
          completedSheets: { orderBy: { completedAt: "desc" }, select: { completedAt: true, score: true, totalProblems: true, accuracyPct: true, worksheet: { select: { title: true } } } },
        },
      });

      const coppaConsents = await db.coppaConsentRequest.findMany({
        where: { parentEmail: user.email ?? "" },
        select: { childFirstName: true, status: true, createdAt: true, verifiedAt: true },
      }).catch(() => []);

      const purchases = user.email
        ? await db.shopPurchase.findMany({
            where: { customerEmail: user.email.toLowerCase() },
            select: { skillsCsv: true, amountCents: true, status: true, createdAt: true },
          })
        : [];

      const bundle = {
        exportedAt: new Date().toISOString(),
        format: "eduyro-data-export/v1",
        account: user,
        parentProfile: parent,
        studentProfile: ownStudent,
        consents: coppaConsents,
        shopPurchases: purchases,
      };

      return new NextResponse(JSON.stringify(bundle, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="eduyro-data-export-${new Date().toISOString().slice(0, 10)}.json"`,
          "Cache-Control": "no-store",
        },
      });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
