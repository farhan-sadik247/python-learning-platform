import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ProblemForm } from "@/components/problems/problem-form";
import { TestCaseManager } from "@/components/problems/test-case-manager";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { deleteProblemAction } from "@/app/actions/problems";

export default async function EditProblemPage({
  params
}: {
  params: Promise<{ problemId: string }>
}) {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  const { problemId } = await params;

  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    include: {
      testCases: {
        orderBy: { order: 'asc' }
      }
    }
  });

  if (!problem || (user.activeRole !== "ADMIN" && problem.createdById !== user.id)) {
    notFound();
  }

  const lessons = await prisma.lesson.findMany({
    where: {
      course: { teacherId: user.activeRole === "ADMIN" ? undefined : user.id }
    },
    include: {
      course: { select: { title: true } }
    },
    orderBy: [
      { course: { title: 'asc' } },
      { order: 'asc' }
    ]
  });

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button render={<Link href="/teacher/problems" />} variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Edit Problem</h2>
            <p className="text-muted-foreground">Update problem details and test cases.</p>
          </div>
        </div>
        <form action={async () => {
          "use server";
          await deleteProblemAction(problem.id);
        }}>
          <Button type="submit" variant="outline" className="text-red-500 border-red-500/20 hover:bg-red-500/10 hover:text-red-600">
            Delete Problem
          </Button>
        </form>
      </div>

      <ProblemForm initialData={problem} lessons={lessons} />
      
      <hr className="border-border" />
      
      <TestCaseManager problemId={problem.id} testCases={problem.testCases} />
    </div>
  );
}
