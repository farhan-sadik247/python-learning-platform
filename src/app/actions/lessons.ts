"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";

export type ActionState = {
  errors?: Record<string, string[]>;
  message?: string;
} | null;

async function verifyCourseOwnership(courseId: string, userId: string, role: string) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return false;
  if (role === "ADMIN") return true;
  return course.teacherId === userId;
}

export async function createLessonAction(
  courseId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  
  const hasOwnership = await verifyCourseOwnership(courseId, user.id, user.activeRole!);
  if (!hasOwnership) {
    return { errors: { general: ["Forbidden: You do not own this course."] } };
  }

  const title = (formData.get("title") as string)?.trim() || "";
  const description = (formData.get("description") as string)?.trim() || null;
  const content = (formData.get("content") as string) || "";
  const section = (formData.get("section") as string)?.trim() || null;
  const driveUrl = (formData.get("driveUrl") as string)?.trim() || null;
  
  const errors: Record<string, string[]> = {};
  if (!title) errors.title = ["Title is required."];
  
  if (Object.keys(errors).length > 0) return { errors };

  // Calculate order (append to end)
  const lastLesson = await prisma.lesson.findFirst({
    where: { courseId },
    orderBy: { order: 'desc' },
  });
  const nextOrder = lastLesson ? lastLesson.order + 1 : 1;

  try {
    await prisma.lesson.create({
      data: {
        title,
        description,
        content,
        section,
        driveUrl,
        order: nextOrder,
        courseId,
      },
    });
  } catch {
    return { errors: { general: ["Failed to create lesson."] } };
  }

  revalidatePath(`/${user.activeRole!.toLowerCase()}/courses/${courseId}`);
  revalidatePath(`/student/courses/${courseId}`);
  redirect(`/${user.activeRole!.toLowerCase()}/courses/${courseId}`);
}

export async function updateLessonAction(
  courseId: string,
  lessonId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  
  const hasOwnership = await verifyCourseOwnership(courseId, user.id, user.activeRole!);
  if (!hasOwnership) {
    return { errors: { general: ["Forbidden: You do not own this course."] } };
  }

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson || lesson.courseId !== courseId) {
    return { errors: { general: ["Lesson not found in this course."] } };
  }

  const title = (formData.get("title") as string)?.trim() || "";
  const description = (formData.get("description") as string)?.trim() || null;
  const content = (formData.get("content") as string) || "";
  const section = (formData.get("section") as string)?.trim() || null;
  const driveUrl = (formData.get("driveUrl") as string)?.trim() || null;
  
  const errors: Record<string, string[]> = {};
  if (!title) errors.title = ["Title is required."];
  
  if (Object.keys(errors).length > 0) return { errors };

  try {
    await prisma.lesson.update({
      where: { id: lessonId },
      data: { title, description, content, section, driveUrl },
    });
  } catch {
    return { errors: { general: ["Failed to update lesson."] } };
  }

  revalidatePath(`/${user.activeRole!.toLowerCase()}/courses/${courseId}`);
  revalidatePath(`/student/courses/${courseId}`);
  revalidatePath(`/student/courses/${courseId}/lessons/${lessonId}`);
  redirect(`/${user.activeRole!.toLowerCase()}/courses/${courseId}`);
}

export async function deleteLessonAction(
  courseId: string,
  lessonId: string
): Promise<ActionState> {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  
  const hasOwnership = await verifyCourseOwnership(courseId, user.id, user.activeRole!);
  if (!hasOwnership) {
    return { errors: { general: ["Forbidden: You do not own this course."] } };
  }

  try {
    await prisma.lesson.delete({
      where: { id: lessonId, courseId },
    });
  } catch {
    return { errors: { general: ["Failed to delete lesson."] } };
  }

  revalidatePath(`/${user.activeRole!.toLowerCase()}/courses/${courseId}`);
  revalidatePath(`/student/courses/${courseId}`);
  redirect(`/${user.activeRole!.toLowerCase()}/courses/${courseId}`);
}

export async function reorderLessonAction(
  courseId: string,
  lessonId: string,
  direction: "up" | "down"
) {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  
  const hasOwnership = await verifyCourseOwnership(courseId, user.id, user.activeRole!);
  if (!hasOwnership) {
    throw new Error("Forbidden: You do not own this course.");
  }

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId, courseId } });
  if (!lesson) throw new Error("Lesson not found");

  // Find the lesson to swap with
  const adjacentLesson = await prisma.lesson.findFirst({
    where: {
      courseId,
      order: direction === "up" ? { lt: lesson.order } : { gt: lesson.order },
    },
    orderBy: { order: direction === "up" ? "desc" : "asc" },
  });

  if (!adjacentLesson) return; // Already at the top/bottom

  // Swap orders transactionally
  await prisma.$transaction([
    prisma.lesson.update({
      where: { id: lesson.id },
      data: { order: adjacentLesson.order },
    }),
    prisma.lesson.update({
      where: { id: adjacentLesson.id },
      data: { order: lesson.order },
    }),
  ]);

  revalidatePath(`/${user.activeRole!.toLowerCase()}/courses/${courseId}`);
  revalidatePath(`/student/courses/${courseId}`);
}
