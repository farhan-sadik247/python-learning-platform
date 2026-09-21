import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ProblemForm } from "@/components/problems/problem-form";
import { TestCaseManager } from "@/components/problems/test-case-manager";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { deleteProblemAction } from "@/app/actions/problems";

export default async function AdminEditProblemPage({
  params,
}: {
  params: Promise<{ problemId: string }>;
}) {
  // Only admins access this route
  await requireRole(["ADMIN"]);
  const { problemId } = await params;

  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    include: {
      testCases: {
        orderBy: { order: "asc" },
      },
      lesson: {
        include: { course: { select: { title: true } } },
      },
    },
  });

  if (!problem) {
    notFound();
  }

  // Admins can see all lessons across all teachers
  const lessons = await prisma.lesson.findMany({
    include: {
      course: { select: { title: true } },
    },
    orderBy: [{ course: { title: "asc" } }, { order: "asc" }],
  });

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div>
        <Button
          render={<Link href="/admin/problems" />}
          variant="ghost"
          className="mb-4 text-muted-foreground hover:text-foreground hover:bg-card -ml-4"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to All Problems
        </Button>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Edit Problem
            </h2>
            <p className="text-muted-foreground">
              Update problem details and test cases.
              {problem.lesson && (
                <span className="ml-1 text-xs">
                  ({problem.lesson.course.title} &gt; {problem.lesson.title})
                </span>
              )}
            </p>
          </div>
          <form
            action={async () => {
              "use server";
              await deleteProblemAction(problem.id);
            }}
          >
            <Button
              type="submit"
              variant="outline"
              className="text-red-500 border-red-500/20 hover:bg-red-500/10 hover:text-red-600"
            >
              Delete Problem
            </Button>
          </form>
        </div>
      </div>

      <ProblemForm initialData={problem} lessons={lessons} />

      <hr className="border-border" />

      <TestCaseManager problemId={problem.id} testCases={problem.testCases} />
    </div>
  );
}

