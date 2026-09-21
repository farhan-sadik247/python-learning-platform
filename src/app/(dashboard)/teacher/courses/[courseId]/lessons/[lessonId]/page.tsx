import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Code,
  AlertTriangle,
  Eye,
  EyeOff,
  Settings2,
} from "lucide-react";
import { deleteProblemAction } from "@/app/actions/problems";

export default async function TeacherLessonDetailPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const user = await requireRole(["TEACHER", "ADMIN"]);
  const { courseId, lessonId } = await params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true, teacherId: true },
  });

  // Security: teacher can only view their own courses
  if (!course || (user.activeRole !== "ADMIN" && course.teacherId !== user.id)) {
    notFound();
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId, courseId },
    include: {
      problems: {
        orderBy: { order: "asc" },
        include: {
          _count: { select: { testCases: true, submissions: true } },
        },
      },
    },
  });

  if (!lesson) {
    notFound();
  }

  // Get per-visibility test case counts for all problems in one efficient query
  const testCaseCounts = await prisma.problemTestCase.groupBy({
    by: ["problemId", "isHidden"],
    where: { problemId: { in: lesson.problems.map(p => p.id) } },
    _count: { id: true },
  });
  const tcMap: Record<string, { visible: number; hidden: number }> = {};
  for (const row of testCaseCounts) {
    if (!tcMap[row.problemId]) tcMap[row.problemId] = { visible: 0, hidden: 0 };
    if (row.isHidden) tcMap[row.problemId].hidden = row._count.id;
    else tcMap[row.problemId].visible = row._count.id;
  }

  const publishedCount = lesson.problems.filter((p) => p.isPublished).length;
  const draftCount = lesson.problems.length - publishedCount;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div>
        <Button
          render={<Link href={`/teacher/courses/${courseId}`} />}
          variant="ghost"
          className="mb-4 text-muted-foreground hover:text-foreground hover:bg-card -ml-4"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Course
        </Button>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">
              <Link
                href={`/teacher/courses/${courseId}`}
                className="hover:text-foreground transition-colors"
              >
                {course.title}
              </Link>
              {" / "}
              <span className="text-foreground">{lesson.title}</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {lesson.title}
            </h2>
            {lesson.description && (
              <p className="text-muted-foreground mt-1 max-w-2xl">
                {lesson.description}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3 shrink-0">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold font-mono text-foreground">
                {lesson.problems.length}
              </span>
              <span className="text-xs text-muted-foreground">
                {lesson.problems.length === 1 ? "Problem" : "Problems"}
              </span>
            </div>
            {publishedCount > 0 && (
              <>
                <div className="w-px h-10 bg-border" />
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold font-mono text-green-500">
                    {publishedCount}
                  </span>
                  <span className="text-xs text-muted-foreground">Published</span>
                </div>
              </>
            )}
            {draftCount > 0 && (
              <>
                <div className="w-px h-10 bg-border" />
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold font-mono text-muted-foreground">
                    {draftCount}
                  </span>
                  <span className="text-xs text-muted-foreground">Draft</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Problems Section */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Practice Problems
        </h3>
        <Button
          render={
            <Link href={`/teacher/problems/new?lessonId=${lesson.id}`} />
          }
          className="bg-[#00A8E8] hover:bg-[#0077B6] text-foreground"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Problem
        </Button>
      </div>

      {lesson.problems.length === 0 ? (
        <Card className="bg-background border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-card p-4 mb-4">
              <Code className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No problems yet
            </h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Create your first coding problem for this lesson. Students will
              see published problems as homework exercises.
            </p>
            <Button
              render={
                <Link href={`/teacher/problems/new?lessonId=${lesson.id}`} />
              }
              className="bg-[#00A8E8] hover:bg-[#0077B6] text-foreground"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Problem
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {lesson.problems.map((problem, index) => {
            const tc = tcMap[problem.id] ?? { visible: 0, hidden: 0 };
            const totalTests = tc.visible + tc.hidden;
            const noTests = totalTests === 0;
            return (
            <Card
              key={problem.id}
              className={`bg-background border-border hover:border-slate-700 transition-colors ${noTests && problem.isPublished ? 'border-yellow-500/30' : ''}`}
            >
              <CardContent className="flex items-center justify-between p-4 gap-4">
                {/* Order indicator */}
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-card text-muted-foreground text-sm font-medium border border-border shrink-0">
                  {index + 1}
                </div>

                {/* Problem info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-foreground truncate">
                      {problem.title}
                    </h4>
                    <Badge
                      variant="outline"
                      className={`shrink-0 text-xs ${
                        problem.difficulty === "EASY"
                          ? "text-green-500 border-green-500/20"
                          : problem.difficulty === "MEDIUM"
                          ? "text-yellow-500 border-yellow-500/20"
                          : "text-red-500 border-red-500/20"
                      }`}
                    >
                      {problem.difficulty}
                    </Badge>
                    {problem.isPublished ? (
                      <Badge
                        variant="outline"
                        className="text-green-500 border-green-500/20 text-xs gap-1"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Published
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground border-muted text-xs gap-1"
                      >
                        <XCircle className="w-3 h-3" />
                        Draft
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    {noTests ? (
                      <span className={`flex items-center gap-1 ${problem.isPublished ? 'text-yellow-500' : ''}`}>
                        {problem.isPublished && <AlertTriangle className="h-3 w-3" />}
                        No test cases
                      </span>
                    ) : (
                      <>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {tc.visible} visible
                        </span>
                        <span className="flex items-center gap-1">
                          <EyeOff className="h-3 w-3" /> {tc.hidden} hidden
                        </span>
                      </>
                    )}
                    <span>{problem._count.submissions} submissions</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    render={
                      <Link
                        href={`/teacher/problems/${problem.id}/edit`}
                      />
                    }
                    variant="outline"
                    size="sm"
                    className="border-[#00A8E8]/30 text-[#00A8E8] hover:bg-[#00A8E8]/10 hover:text-[#00A8E8]"
                  >
                    <Settings2 className="h-3 w-3 mr-1" />
                    Manage Tests
                  </Button>

                  <Button
                    render={
                      <Link
                        href={`/teacher/problems/${problem.id}/edit?from=${encodeURIComponent(
                          `/teacher/courses/${courseId}/lessons/${lessonId}`
                        )}`}
                      />
                    }
                    variant="outline"
                    size="sm"
                    className="border-border text-muted-foreground hover:text-foreground hover:bg-card"
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit
                  </Button>

                  <form
                    action={async () => {
                      "use server";
                      await deleteProblemAction(problem.id);
                    }}
                  >
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      className="border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-600"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
