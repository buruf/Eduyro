// src/lib/integrations/google-classroom/roster-sync.ts
// Sync students from a Google Classroom course into BrightSteps.

import { db } from "@/lib/db";
import { getAuthorizedClient, getClassroomApi } from "./client";
import { hash } from "bcryptjs";
import { nanoid } from "nanoid";

export interface RosterSyncResult {
  courseId: string;
  studentsImported: number;
  studentsUpdated: number;
  studentsSkipped: number;
  errors: string[];
}

export async function listCourses(userId: string): Promise<{
  id: string;
  name: string;
  section?: string | null;
  studentCount?: number;
}[]> {
  const auth = await getAuthorizedClient(userId);
  const classroom = getClassroomApi(auth);
  const res = await classroom.courses.list({
    teacherId: "me",
    courseStates: ["ACTIVE"],
    pageSize: 100,
  });
  return (res.data.courses ?? []).map((c) => ({
    id: c.id ?? "",
    name: c.name ?? "Untitled course",
    section: c.section,
    studentCount: undefined, // requires extra API call to fetch
  }));
}

export async function syncRoster(params: {
  userId: string;          // teacher user ID in BrightSteps
  schoolId: string;        // target school
  classroomCourseId: string;
}): Promise<RosterSyncResult> {
  const result: RosterSyncResult = {
    courseId: params.classroomCourseId,
    studentsImported: 0,
    studentsUpdated: 0,
    studentsSkipped: 0,
    errors: [],
  };

  try {
    const auth = await getAuthorizedClient(params.userId);
    const classroom = getClassroomApi(auth);

    // Fetch all students in the course
    const allStudents: any[] = [];
    let pageToken: string | undefined;
    do {
      const resp = await classroom.courses.students.list({
        courseId: params.classroomCourseId,
        pageSize: 100,
        pageToken,
      });
      allStudents.push(...(resp.data.students ?? []));
      pageToken = resp.data.nextPageToken ?? undefined;
    } while (pageToken);

    for (const gcStudent of allStudents) {
      try {
        const email = gcStudent.profile?.emailAddress;
        const fullName = gcStudent.profile?.name?.fullName ?? "";
        const firstName = gcStudent.profile?.name?.givenName ?? fullName.split(" ")[0];
        const lastName = gcStudent.profile?.name?.familyName ?? "";

        if (!email) {
          result.studentsSkipped++;
          continue;
        }

        // Find existing user
        let user = await db.user.findUnique({ where: { email } });

        if (!user) {
          // Create new user (no password — they'll use Google sign-in)
          user = await db.user.create({
            data: {
              email,
              firstName,
              lastName,
              name: fullName,
              role: "STUDENT",
              provider: "GOOGLE",
              emailVerified: new Date(), // verified by Google
              passwordHash: await hash(nanoid(32), 12), // placeholder
            },
          });

          await db.student.create({
            data: {
              userId: user.id,
              schoolId: params.schoolId,
              externalId: gcStudent.userId,
              source: "GOOGLE_CLASSROOM",
            },
          });

          result.studentsImported++;
        } else {
          // Update name, link to school if missing
          const existingStudent = await db.student.findUnique({
            where: { userId: user.id },
          });

          if (existingStudent) {
            if (!existingStudent.schoolId || existingStudent.schoolId !== params.schoolId) {
              await db.student.update({
                where: { id: existingStudent.id },
                data: {
                  schoolId: params.schoolId,
                  externalId: gcStudent.userId,
                  source: "GOOGLE_CLASSROOM",
                },
              });
              result.studentsUpdated++;
            } else {
              result.studentsSkipped++;
            }
          } else {
            await db.student.create({
              data: {
                userId: user.id,
                schoolId: params.schoolId,
                externalId: gcStudent.userId,
                source: "GOOGLE_CLASSROOM",
              },
            });
            result.studentsImported++;
          }
        }
      } catch (err: any) {
        result.errors.push(`${gcStudent.profile?.emailAddress}: ${err.message}`);
      }
    }

    // Record the sync
    await db.googleClassroomCourseLink.upsert({
      where: { classroomCourseId: params.classroomCourseId },
      create: {
        classroomCourseId: params.classroomCourseId,
        schoolId: params.schoolId,
        teacherId: params.userId,
        lastSyncedAt: new Date(),
        lastSyncResult: result as any,
      },
      update: {
        lastSyncedAt: new Date(),
        lastSyncResult: result as any,
      },
    });
  } catch (err: any) {
    result.errors.push(`Sync failed: ${err.message}`);
  }

  return result;
}
