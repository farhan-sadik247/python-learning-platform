"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function toggleLessonProgressAction(
  courseId: string,
  lessonId: string,
  completed: boolean
) {
  const user = await requireRole(["STUDENT"]);
  
  // Verify the lesson exists
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId, courseId },
  });
  
  if (!lesson) {
    throw new Error("Lesson not found");
  }

  // Upsert progress
  await prisma.progress.upsert({
    where: {
      userId_lessonId: {
        userId: user.id,
        lessonId: lessonId,
      }
    },
    update: {
      completed,
      completedAt: completed ? new Date() : null,
    },
    create: {
      userId: user.id,
      lessonId: lessonId,
      completed,
      completedAt: completed ? new Date() : null,
    },
  });

  revalidatePath(`/student/courses/${courseId}`);
  revalidatePath(`/student/courses/${courseId}/lessons/${lessonId}`);
}
