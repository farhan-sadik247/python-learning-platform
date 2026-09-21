import { requireRole, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Circle, Folder, ChevronRight, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function StudentHomeworksPage() {
  await requireRole(["STUDENT"]);
  const user = await getCurrentUser();
  if (!user) return null;

  // 1. Fetch courses, lessons, and published problems
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      lessons: {
        orderBy: { order: "asc" },
        include: {
          problems: {
            where: { isPublished: true },
            orderBy: [{ order: "asc" }, { title: "asc" }],
          }
        }
      }
    }
  });

  // 2. Fetch the student's submissions to determine solved status
  const submissions = await prisma.submission.findMany({
    where: { userId: user.id },
    select: { problemId: true, status: true }
  });

  // Build a set of solved problem IDs
  const solvedProblemIds = new Set<string>();
  for (const sub of submissions) {
    if (sub.status === "ACCEPTED") {
      solvedProblemIds.add(sub.problemId);
    }
  }

  // Calculate summary stats
  let totalProblems = 0;
  let solvedCount = 0;

  for (const course of courses) {
    for (const lesson of course.lessons) {
      for (const problem of lesson.problems) {
        totalProblems++;
        if (solvedProblemIds.has(problem.id)) {
          solvedCount++;
        }
      }
    }
  }

  const remainingCount = totalProblems - solvedCount;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Homeworks</h2>
        <p className="text-muted-foreground">Complete your assigned problems for each week.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="bg-background border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Remaining Work</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{remainingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Problems to solve</p>
          </CardContent>
        </Card>
        <Card className="bg-background border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{solvedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Problems solved</p>
          </CardContent>
        </Card>
      </div>

      {totalProblems === 0 ? (
        <Card className="bg-background border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-card p-4 mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No homework available</h3>
            <p className="text-muted-foreground max-w-sm">
              There are no published coding problems yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {courses.map(course => {
            const courseProblemCount = course.lessons.reduce((acc, l) => acc + l.problems.length, 0);
            if (courseProblemCount === 0) return null;

            return (
              <div key={course.id} className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <Folder className="h-5 w-5 text-[#00A8E8]" />
                  <h3 className="text-lg font-semibold text-foreground">{course.title}</h3>
                </div>

                <div className="pl-2 sm:pl-6 space-y-6">
                  {course.lessons.map(lesson => {
                    if (lesson.problems.length === 0) return null;
                    return (
                      <details key={lesson.id} className="group bg-card border border-border rounded-lg overflow-hidden" open>
                        <summary className="flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/50 transition-colors list-none [&::-webkit-details-marker]:hidden border-b border-border/50">
                          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
                          <h4 className="font-medium text-foreground text-sm">
                            {lesson.section ? `${lesson.section}: ${lesson.title}` : lesson.title}
                          </h4>
                        </summary>
                        <div className="p-3 bg-background space-y-2">
                          {lesson.problems.map(problem => {
                            const isSolved = solvedProblemIds.has(problem.id);
                            return (
                              <Link 
                                key={problem.id} 
                                href={`/student/problems/${problem.id}`}
                                className={`flex items-center justify-between p-3 border rounded-md transition-colors hover:border-slate-500 ${isSolved ? 'bg-muted/30 border-border/50' : 'bg-card border-border hover:bg-muted/20'}`}
                              >
                                <div className="flex items-center gap-3">
                                  {isSolved ? (
                                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-muted-foreground opacity-50 shrink-0" />
                                  )}
                                  <span className={`text-sm font-medium ${isSolved ? 'text-muted-foreground' : 'text-foreground'}`}>
                                    {problem.title}
                                  </span>
                                  <Badge variant="outline" className={`ml-2 text-[10px] h-5 px-1.5 ${
                                      problem.difficulty === "EASY" ? "text-green-500 border-green-500/20" :
                                      problem.difficulty === "MEDIUM" ? "text-yellow-500 border-yellow-500/20" :
                                      "text-red-500 border-red-500/20"
                                  }`}>
                                    {problem.difficulty}
                                  </Badge>
                                </div>
                                <div className="text-xs">
                                  {isSolved ? (
                                    <span className="text-green-500 font-medium">Solved</span>
                                  ) : (
                                    <span className="text-[#00A8E8] font-medium">Solve &rarr;</span>
                                  )}
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </details>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

