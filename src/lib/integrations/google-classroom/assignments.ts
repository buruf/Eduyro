// src/lib/integrations/google-classroom/assignments.ts
// Post BrightSteps worksheets as Google Classroom assignments.
// One assignment per student per day, with the PDF link.

import { db } from "@/lib/db";
import { getAuthorizedClient, getClassroomApi } from "./client";

export async function createAssignment(params: {
  teacherUserId: string;
  classroomCourseId: string;
  title: string;
  description: string;
  pdfUrl: string;
  studentIds?: string[]; // Google Classroom student IDs; if omitted, assigns to all
  dueDate?: Date;
  points?: number;
}): Promise<{ assignmentId: string; classroomLink: string }> {
  const auth = await getAuthorizedClient(params.teacherUserId);
  const classroom = getClassroomApi(auth);

  const courseWork: any = {
    title: params.title,
    description: params.description,
    workType: "ASSIGNMENT",
    state: "PUBLISHED",
    materials: [
      {
        link: {
          url: params.pdfUrl,
          title: params.title,
        },
      },
    ],
    maxPoints: params.points ?? 100,
  };

  if (params.dueDate) {
    courseWork.dueDate = {
      year: params.dueDate.getFullYear(),
      month: params.dueDate.getMonth() + 1,
      day: params.dueDate.getDate(),
    };
    courseWork.dueTime = { hours: 23, minutes: 59 };
  }

  if (params.studentIds && params.studentIds.length > 0) {
    courseWork.assigneeMode = "INDIVIDUAL_STUDENTS";
    courseWork.individualStudentsOptions = { studentIds: params.studentIds };
  }

  const created = await classroom.courses.courseWork.create({
    courseId: params.classroomCourseId,
    requestBody: courseWork,
  });

  return {
    assignmentId: created.data.id ?? "",
    classroomLink: created.data.alternateLink ?? "",
  };
}

export async function postGrade(params: {
  teacherUserId: string;
  classroomCourseId: string;
  assignmentId: string;
  studentClassroomId: string;
  grade: number;
  feedback?: string;
}): Promise<void> {
  const auth = await getAuthorizedClient(params.teacherUserId);
  const classroom = getClassroomApi(auth);

  // Fetch the submission
  const submissions = await classroom.courses.courseWork.studentSubmissions.list({
    courseId: params.classroomCourseId,
    courseWorkId: params.assignmentId,
    userId: params.studentClassroomId,
  });

  const submission = submissions.data.studentSubmissions?.[0];
  if (!submission?.id) {
    throw new Error("No submission found for student");
  }

  await classroom.courses.courseWork.studentSubmissions.patch({
    courseId: params.classroomCourseId,
    courseWorkId: params.assignmentId,
    id: submission.id,
    updateMask: "assignedGrade,draftGrade",
    requestBody: {
      assignedGrade: params.grade,
      draftGrade: params.grade,
    },
  });
}
