"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";

export type ActionState = {
  errors?: Record<string, string[]>;
  message?: string;
} | null;

export async function createCourseAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  
  const title = (formData.get("title") as string)?.trim() || "";
  const description = (formData.get("description") as string)?.trim() || null;
  
  let teacherId = user.id;
  if (user.activeRole! === "ADMIN") {
    const selectedTeacherId = formData.get("teacherId") as string;
    if (selectedTeacherId) {
      teacherId = selectedTeacherId;
    }
  }

  const errors: Record<string, string[]> = {};
  if (!title) {
    errors.title = ["Title is required."];
  }
  
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  let newCourseId = "";
  try {
    const course = await prisma.course.create({
      data: {
        title,
        description,
        teacherId,
      },
    });
    newCourseId = course.id;
  } catch {
    return { errors: { general: ["Failed to create course."] } };
  }

  revalidatePath(`/${user.activeRole!.toLowerCase()}/courses`);
  redirect(`/${user.activeRole!.toLowerCase()}/courses/${newCourseId}`);
}

export async function updateCourseAction(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) {
    return { errors: { general: ["Course not found."] } };
  }

  if (user.activeRole! !== "ADMIN" && course.teacherId !== user.id) {
    return { errors: { general: ["Forbidden: You do not own this course."] } };
  }

  const title = (formData.get("title") as string)?.trim() || "";
  const description = (formData.get("description") as string)?.trim() || null;
  
  let teacherId = course.teacherId;
  if (user.activeRole! === "ADMIN") {
    const selectedTeacherId = formData.get("teacherId") as string;
    if (selectedTeacherId) {
      teacherId = selectedTeacherId;
    }
  }

  const errors: Record<string, string[]> = {};
  if (!title) {
    errors.title = ["Title is required."];
  }
  
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    await prisma.course.update({
      where: { id },
      data: { title, description, teacherId },
    });
  } catch {
    return { errors: { general: ["Failed to update course."] } };
  }

  revalidatePath(`/${user.activeRole!.toLowerCase()}/courses`);
  revalidatePath(`/${user.activeRole!.toLowerCase()}/courses/${id}`);
  revalidatePath(`/student/courses`);
  revalidatePath(`/student/courses/${id}`);
  
  redirect(`/${user.activeRole!.toLowerCase()}/courses/${id}`);
}

export async function deleteCourseAction(
  id: string
): Promise<ActionState> {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) {
    return { errors: { general: ["Course not found."] } };
  }

  if (user.activeRole! !== "ADMIN" && course.teacherId !== user.id) {
    return { errors: { general: ["Forbidden: You do not own this course."] } };
  }

  try {
    await prisma.course.delete({ where: { id } });
  } catch {
    return { errors: { general: ["Failed to delete course."] } };
  }

  revalidatePath(`/${user.activeRole!.toLowerCase()}/courses`);
  revalidatePath(`/student/courses`);
  redirect(`/${user.activeRole!.toLowerCase()}/courses`);
}
