import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Code, CheckCircle, XCircle, AlertTriangle, Eye, EyeOff, Settings2, Pencil, ChevronRight, Folder } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function TeacherProblemsPage() {
  const user = await requireRole(["TEACHER"]);

  // 1. Fetch courses with lessons and their problems
  const courses = await prisma.course.findMany({
    where: { teacherId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      lessons: {
        orderBy: { order: "asc" },
        include: {
          problems: {
            orderBy: [{ order: "asc" }, { title: "asc" }],
            include: {
              _count: { select: { testCases: true, submissions: true } }
            }
          }
        }
      }
    }
  });

  // 2. Fetch unassigned problems (problems created by this teacher but with no lessonId)
  const unassignedProblems = await prisma.problem.findMany({
    where: { 
      createdById: user.id,
      lessonId: null 
    },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { testCases: true, submissions: true } }
    }
  });

  // 3. Get per-visibility test case counts for ALL problems the teacher owns
  const testCaseCounts = await prisma.problemTestCase.groupBy({
    by: ["problemId", "isHidden"],
    where: { problem: { createdById: user.id } },
    _count: { id: true }
  });

  const tcMap: Record<string, { visible: number; hidden: number }> = {};
  for (const row of testCaseCounts) {
    if (!tcMap[row.problemId]) tcMap[row.problemId] = { visible: 0, hidden: 0 };
    if (row.isHidden) tcMap[row.problemId].hidden = row._count.id;
    else tcMap[row.problemId].visible = row._count.id;
  }

  // Component to render a problem row
  const renderProblem = (problem: { id: string; title: string; difficulty: string; isPublished: boolean; _count: { submissions: number } }) => {
    const tc = tcMap[problem.id] ?? { visible: 0, hidden: 0 };
    const totalTests = tc.visible + tc.hidden;
    const noTests = totalTests === 0;

    return (
      <div key={problem.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-4 border rounded-md bg-card transition-colors hover:border-slate-600 ${noTests && problem.isPublished ? 'border-yellow-500/40' : 'border-border'}`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="font-medium text-foreground truncate text-sm">
              {problem.title}
            </h4>
            <Badge variant="outline" className={`shrink-0 text-[10px] h-5 px-1.5 ${
                problem.difficulty === "EASY" ? "text-green-500 border-green-500/20" :
                problem.difficulty === "MEDIUM" ? "text-yellow-500 border-yellow-500/20" :
                "text-red-500 border-red-500/20"
            }`}>
              {problem.difficulty}
            </Badge>
            {problem.isPublished ? (
              <Badge variant="outline" className="text-green-500 border-green-500/20 text-[10px] h-5 px-1.5 gap-1">
                <CheckCircle className="w-3 h-3" /> Published
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground border-muted text-[10px] h-5 px-1.5 gap-1">
                <XCircle className="w-3 h-3" /> Draft
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            {noTests ? (
              <span className={`flex items-center gap-1 ${problem.isPublished ? 'text-yellow-500' : ''}`}>
                {problem.isPublished && <AlertTriangle className="h-3 w-3" />}
                No test cases
              </span>
            ) : (
              <>
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {tc.visible} visible</span>
                <span className="flex items-center gap-1"><EyeOff className="h-3 w-3" /> {tc.hidden} hidden</span>
              </>
            )}
            <span>{problem._count.submissions} submissions</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button render={<Link href={`/teacher/problems/${problem.id}/edit`} />} variant="outline" size="sm" className="h-7 text-xs border-[#00A8E8]/30 text-[#00A8E8] hover:bg-[#00A8E8]/10 hover:text-[#00A8E8]">
            <Settings2 className="h-3 w-3 mr-1" /> Manage Tests
          </Button>
          <Button render={<Link href={`/teacher/problems/${problem.id}/edit?from=/teacher/problems`} />} variant="outline" size="sm" className="h-7 text-xs border-border text-muted-foreground hover:text-foreground">
            <Pencil className="h-3 w-3 mr-1" /> Edit
          </Button>
        </div>
      </div>
    );
  };

  const hasAnyProblems = courses.some(c => c.lessons.some(l => l.problems.length > 0)) || unassignedProblems.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">My Problems</h2>
          <p className="text-muted-foreground">Manage homework and coding exercises by week.</p>
        </div>
        <Button render={<Link href="/teacher/problems/new" />} className="bg-[#00A8E8] hover:bg-[#0077B6] text-white">
          <Plus className="mr-2 h-4 w-4" /> Create Problem
        </Button>
      </div>

      {!hasAnyProblems ? (
        <Card className="bg-background border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-card p-4 mb-4">
              <Code className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No problems yet</h3>
            <p className="text-muted-foreground max-w-sm mb-6">Create your first Python problem to assign as homework.</p>
            <Button render={<Link href="/teacher/problems/new" />} className="bg-[#00A8E8] hover:bg-[#0077B6] text-white">
              <Plus className="mr-2 h-4 w-4" /> Create Problem
            </Button>
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
                  <Badge variant="secondary" className="ml-2 bg-muted text-muted-foreground">{courseProblemCount} Problems</Badge>
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
                          {lesson.problems.map(problem => renderProblem(problem))}
                        </div>
                      </details>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {unassignedProblems.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-border opacity-80">
              <div className="flex items-center gap-2 pb-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <h3 className="text-lg font-semibold text-foreground">Unassigned Problems</h3>
                <Badge variant="secondary" className="ml-2 bg-muted text-muted-foreground">{unassignedProblems.length} Legacy</Badge>
              </div>
              <p className="text-xs text-muted-foreground">These problems are not attached to any course or week. Edit them to assign a lesson.</p>
              <div className="pl-2 sm:pl-6 space-y-2">
                {unassignedProblems.map(problem => renderProblem(problem))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
