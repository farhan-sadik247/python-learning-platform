"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProblemDifficulty } from "@/generated/prisma/client";

export type ActionState = {
  errors?: Record<string, string[]>;
  message?: string;
} | null;

async function verifyLessonOwnership(lessonId: string, userId: string, role: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { course: true }
  });
  if (!lesson) return false;
  if (role === "ADMIN") return true;
  return lesson.course.teacherId === userId;
}

export async function createProblemAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  
  const title = (formData.get("title") as string)?.trim() || "";
  const description = (formData.get("description") as string)?.trim() || "";
  const difficultyStr = (formData.get("difficulty") as string) || "EASY";
  const lessonId = (formData.get("lessonId") as string)?.trim() || "";
  const starterCode = (formData.get("starterCode") as string)?.trim() || null;
  const hints = (formData.get("hints") as string)?.trim() || null;
  const isPublished = formData.get("isPublished") === "on" || formData.get("isPublished") === "true";
  
  const errors: Record<string, string[]> = {};
  if (!title) errors.title = ["Title is required."];
  if (!description) errors.description = ["Description is required."];
  if (!lessonId) errors.lessonId = ["Lesson is required."];
  if (!Object.values(ProblemDifficulty).includes(difficultyStr as ProblemDifficulty)) {
    errors.difficulty = ["Invalid difficulty."];
  }
  
  if (Object.keys(errors).length > 0) return { errors };

  const hasOwnership = await verifyLessonOwnership(lessonId, user.id, user.activeRole!);
  if (!hasOwnership) {
    return { errors: { general: ["Forbidden: You do not have access to this lesson."] } };
  }

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }});
  if (!lesson) {
     return { errors: { general: ["Lesson not found."] } };
  }

  const lastProblem = await prisma.problem.findFirst({
    where: { lessonId },
    orderBy: { order: 'desc' }
  });
  const nextOrder = lastProblem ? lastProblem.order + 1 : 1;

  // Read optional lesson-context for redirect (validated server-side — not trusted for auth)
  const returnToLessonId = (formData.get("returnToLesson") as string)?.trim() || null;

  let newProblemId = "";
  try {
    const problem = await prisma.problem.create({
      data: {
        title,
        description,
        difficulty: difficultyStr as ProblemDifficulty,
        starterCode,
        hints,
        order: nextOrder,
        isPublished,
        courseId: lesson.courseId,
        lessonId,
        createdById: user.id
      },
    });
    newProblemId = problem.id;
  } catch {
    return { errors: { general: ["Failed to create problem."] } };
  }

  revalidatePath(`/${user.activeRole!.toLowerCase()}/problems`);

  // If created from a specific lesson context, redirect back to that lesson's detail page
  if (returnToLessonId && returnToLessonId === lessonId) {
    // Re-validate: fetch the lesson to get its courseId for the redirect URL
    const lessonForRedirect = await prisma.lesson.findUnique({
      where: { id: returnToLessonId },
      select: { courseId: true }
    });
    if (lessonForRedirect) {
      revalidatePath(`/teacher/courses/${lessonForRedirect.courseId}/lessons/${returnToLessonId}`);
      redirect(`/teacher/courses/${lessonForRedirect.courseId}/lessons/${returnToLessonId}`);
    }
  }

  redirect(`/${user.activeRole!.toLowerCase()}/problems/${newProblemId}/edit`);
}

export async function updateProblemAction(
  problemId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireRole(["ADMIN", "TEACHER"]);

  const problem = await prisma.problem.findUnique({ where: { id: problemId }});
  if (!problem) return { errors: { general: ["Problem not found."] } };

  if (user.activeRole! !== "ADMIN" && problem.createdById !== user.id) {
    return { errors: { general: ["Forbidden: You do not own this problem."] } };
  }

  const title = (formData.get("title") as string)?.trim() || "";
  const description = (formData.get("description") as string)?.trim() || "";
  const difficultyStr = (formData.get("difficulty") as string) || "EASY";
  const lessonId = (formData.get("lessonId") as string)?.trim() || "";
  const starterCode = (formData.get("starterCode") as string)?.trim() || null;
  const hints = (formData.get("hints") as string)?.trim() || null;
  const isPublished = formData.get("isPublished") === "on" || formData.get("isPublished") === "true";
  
  const errors: Record<string, string[]> = {};
  if (!title) errors.title = ["Title is required."];
  if (!description) errors.description = ["Description is required."];
  if (!lessonId) errors.lessonId = ["Lesson is required."];
  if (!Object.values(ProblemDifficulty).includes(difficultyStr as ProblemDifficulty)) {
    errors.difficulty = ["Invalid difficulty."];
  }
  
  if (Object.keys(errors).length > 0) return { errors };

  if (lessonId !== problem.lessonId) {
    const hasOwnership = await verifyLessonOwnership(lessonId, user.id, user.activeRole!);
    if (!hasOwnership) {
      return { errors: { general: ["Forbidden: You do not have access to this new lesson."] } };
    }
  }

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }});
  
  try {
    await prisma.problem.update({
      where: { id: problemId },
      data: {
        title,
        description,
        difficulty: difficultyStr as ProblemDifficulty,
        starterCode,
        hints,
        isPublished,
        courseId: lesson?.courseId,
        lessonId
      },
    });
  } catch {
    return { errors: { general: ["Failed to update problem."] } };
  }

  revalidatePath(`/${user.activeRole!.toLowerCase()}/problems`);
  revalidatePath(`/${user.activeRole!.toLowerCase()}/problems/${problemId}/edit`);
  return { message: "Problem updated successfully." };
}

export async function deleteProblemAction(
  problemId: string
): Promise<ActionState> {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  
  const problem = await prisma.problem.findUnique({ where: { id: problemId }});
  if (!problem) return { errors: { general: ["Problem not found."] } };

  if (user.activeRole! !== "ADMIN" && problem.createdById !== user.id) {
    return { errors: { general: ["Forbidden: You do not own this problem."] } };
  }

  try {
    await prisma.problem.delete({ where: { id: problemId }});
  } catch {
    return { errors: { general: ["Failed to delete problem."] } };
  }

  revalidatePath(`/${user.activeRole!.toLowerCase()}/problems`);
  redirect(`/${user.activeRole!.toLowerCase()}/problems`);
}

