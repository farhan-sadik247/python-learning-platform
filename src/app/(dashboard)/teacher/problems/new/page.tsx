import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProblemForm } from "@/components/problems/problem-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";

export default async function NewProblemPage({
  searchParams,
}: {
  searchParams: Promise<{ lessonId?: string }>;
}) {
  const user = await requireRole(["TEACHER", "ADMIN"]);
  const { lessonId: rawLessonId } = await searchParams;

  // Server-side validate the lessonId if provided
  let defaultLessonId: string | undefined;
  let backHref = `/${user.activeRole!.toLowerCase()}/problems`;

  if (rawLessonId) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: rawLessonId },
      include: { course: { select: { teacherId: true, id: true } } },
    });

    if (!lesson) notFound();

    // Security: only the owning teacher (or admin) can pre-select this lesson
    if (user.activeRole !== "ADMIN" && lesson.course.teacherId !== user.id) {
      notFound();
    }

    defaultLessonId = lesson.id;
    backHref = `/teacher/courses/${lesson.course.id}/lessons/${lesson.id}`;
  }

  // Get all lessons for courses this teacher owns
  const lessons = await prisma.lesson.findMany({
    where: {
      course: { teacherId: user.activeRole === "ADMIN" ? undefined : user.id },
    },
    include: {
      course: { select: { title: true } },
    },
    orderBy: [{ course: { title: "asc" } }, { order: "asc" }],
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Button
          render={<Link href={backHref} />}
          variant="ghost"
          className="mb-4 text-muted-foreground hover:text-foreground hover:bg-card -ml-4"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Create Problem
        </h2>
        <p className="text-muted-foreground">
          Add a new coding problem (homework exercise) to a lesson.
        </p>
      </div>

      {lessons.length === 0 ? (
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-4 rounded-md">
          <p>
            You need to create a course and a lesson before you can create a
            problem.
          </p>
        </div>
      ) : (
        <ProblemForm lessons={lessons} defaultLessonId={defaultLessonId} />
      )}
    </div>
  );
}
