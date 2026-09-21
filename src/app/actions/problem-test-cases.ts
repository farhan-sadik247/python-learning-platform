"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export type ActionState = {
  errors?: Record<string, string[]>;
  message?: string;
} | null;

async function verifyProblemOwnership(problemId: string, userId: string, role: string) {
  const problem = await prisma.problem.findUnique({
    where: { id: problemId }
  });
  if (!problem) return false;
  if (role === "ADMIN") return true;
  return problem.createdById === userId;
}

export async function createProblemTestCaseAction(
  problemId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  
  const hasOwnership = await verifyProblemOwnership(problemId, user.id, user.activeRole!);
  if (!hasOwnership) {
    return { errors: { general: ["Forbidden: You do not have access to this problem."] } };
  }

  const input = (formData.get("input") as string) ?? ""; // empty string is valid (no stdin programs)
  const expectedOutput = (formData.get("expectedOutput") as string) || "";
  const isHidden = formData.get("isHidden") === "on" || formData.get("isHidden") === "true";
  
  const errors: Record<string, string[]> = {};
  if (!expectedOutput.trim()) errors.expectedOutput = ["Expected output is required."];
  
  if (Object.keys(errors).length > 0) return { errors };

  const lastTestCase = await prisma.problemTestCase.findFirst({
    where: { problemId },
    orderBy: { order: 'desc' }
  });
  const nextOrder = lastTestCase ? lastTestCase.order + 1 : 1;

  try {
    await prisma.problemTestCase.create({
      data: {
        problemId,
        input,
        expectedOutput,
        isHidden,
        order: nextOrder
      },
    });
  } catch {
    return { errors: { general: ["Failed to create test case."] } };
  }

  revalidatePath(`/teacher/problems/${problemId}/edit`);
  revalidatePath(`/admin/problems/${problemId}/edit`);
  return { message: "Test case created successfully." };
}

export async function updateProblemTestCaseAction(
  problemId: string,
  testCaseId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  
  const hasOwnership = await verifyProblemOwnership(problemId, user.id, user.activeRole!);
  if (!hasOwnership) {
    return { errors: { general: ["Forbidden: You do not have access to this problem."] } };
  }

  const testCase = await prisma.problemTestCase.findUnique({ where: { id: testCaseId }});
  if (!testCase || testCase.problemId !== problemId) {
    return { errors: { general: ["Test case not found."] } };
  }

  const input = (formData.get("input") as string) || "";
  const expectedOutput = (formData.get("expectedOutput") as string) || "";
  const isHidden = formData.get("isHidden") === "on" || formData.get("isHidden") === "true";
  const orderStr = formData.get("order") as string;
  const order = orderStr ? parseInt(orderStr, 10) : testCase.order;

  const errors: Record<string, string[]> = {};
  if (formData.get("input") === null) errors.input = ["Input is required."];
  if (formData.get("expectedOutput") === null) errors.expectedOutput = ["Expected output is required."];
  
  if (Object.keys(errors).length > 0) return { errors };

  try {
    await prisma.problemTestCase.update({
      where: { id: testCaseId },
      data: {
        input,
        expectedOutput,
        isHidden,
        order
      },
    });
  } catch {
    return { errors: { general: ["Failed to update test case."] } };
  }

  revalidatePath(`/teacher/problems/${problemId}/edit`);
  revalidatePath(`/admin/problems/${problemId}/edit`);
  return { message: "Test case updated successfully." };
}

export async function deleteProblemTestCaseAction(
  problemId: string,
  testCaseId: string
): Promise<ActionState> {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  
  const hasOwnership = await verifyProblemOwnership(problemId, user.id, user.activeRole!);
  if (!hasOwnership) {
    return { errors: { general: ["Forbidden: You do not have access to this problem."] } };
  }

  try {
    await prisma.problemTestCase.delete({
      where: { id: testCaseId, problemId }, // ensure it belongs to the problem
    });
  } catch {
    return { errors: { general: ["Failed to delete test case."] } };
  }

  revalidatePath(`/teacher/problems/${problemId}/edit`);
  revalidatePath(`/admin/problems/${problemId}/edit`);
  return { message: "Test case deleted successfully." };
}

