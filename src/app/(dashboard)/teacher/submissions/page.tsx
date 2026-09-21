import { requireRole, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Folder, ChevronRight, CheckCircle, XCircle, Clock, AlertTriangle, AlertCircle, FileCode } from "lucide-react";
import type { SubmissionStatus } from "@/generated/prisma/client";


export const metadata = {
  title: "Student Submissions | Teacher Dashboard",
};

export function getStatusConfig(status: SubmissionStatus) {
  switch (status) {
    case "ACCEPTED":
      return { label: "Accepted", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle };
    case "WRONG_ANSWER":
      return { label: "Wrong Answer", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle };
    case "TIMEOUT":
      return { label: "Time Limit", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: Clock };
    case "RUNTIME_ERROR":
      return { label: "Runtime Error", color: "bg-orange-500/10 text-orange-500 border-orange-500/20", icon: AlertTriangle };
    case "OUTPUT_LIMIT_EXCEEDED":
      return { label: "Output Limit", color: "bg-purple-500/10 text-purple-500 border-purple-500/20", icon: AlertCircle };
    case "INTERNAL_ERROR":
      return { label: "Internal Error", color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertCircle };
    default:
      return { label: status, color: "bg-muted text-muted-foreground border-border", icon: AlertCircle };
  }
}

export default async function TeacherSubmissionsPage() {
  await requireRole(["TEACHER"]);
  const user = await getCurrentUser();
  if (!user) return null;

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
              submissions: {
                orderBy: { createdAt: "desc" },
                select: {
                  id: true,
                  status: true,
                  score: true,
                  passedTests: true,
                  totalTests: true,
                  createdAt: true,
                  user: { select: { name: true, email: true } }
                }
              }
            }
          }
        }
      }
    }
  });

  const hasAnySubmissions = courses.some(c => 
    c.lessons.some(l => 
      l.problems.some(p => p.submissions.length > 0)
    )
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Student Submissions</h1>
        <p className="text-muted-foreground mt-2">
          Monitor code submissions for problems you created, organized by week.
        </p>
      </div>

      {!hasAnySubmissions ? (
        <Card className="bg-background border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-card p-4 mb-4">
              <FileCode className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No submissions yet</h3>
            <p className="text-muted-foreground max-w-sm">Students haven&apos;t submitted any code for your problems yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {courses.map(course => {
            const courseHasSubmissions = course.lessons.some(l => l.problems.some(p => p.submissions.length > 0));
            if (!courseHasSubmissions) return null;

            return (
              <div key={course.id} className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <Folder className="h-5 w-5 text-[#00A8E8]" />
                  <h3 className="text-lg font-semibold text-foreground">{course.title}</h3>
                </div>

                <div className="pl-2 sm:pl-6 space-y-6">
                  {course.lessons.map(lesson => {
                    const lessonHasSubmissions = lesson.problems.some(p => p.submissions.length > 0);
                    if (!lessonHasSubmissions) return null;

                    return (
                      <details key={lesson.id} className="group bg-card border border-border rounded-lg overflow-hidden" open>
                        <summary className="flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/50 transition-colors list-none [&::-webkit-details-marker]:hidden border-b border-border/50">
                          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
                          <h4 className="font-medium text-foreground text-sm">
                            {lesson.section ? `${lesson.section}: ${lesson.title}` : lesson.title}
                          </h4>
                        </summary>
                        
                        <div className="p-3 bg-background space-y-4">
                          {lesson.problems.map(problem => {
                            if (problem.submissions.length === 0) return null;
                            
                            return (
                              <div key={problem.id} className="border border-border rounded-md bg-card overflow-hidden">
                                <div className="bg-muted/30 px-4 py-2 border-b border-border flex items-center justify-between">
                                  <h5 className="font-medium text-sm text-foreground">{problem.title}</h5>
                                  <span className="text-xs text-muted-foreground">{problem.submissions.length} submissions</span>
                                </div>
                                <div className="divide-y divide-border">
                                  {problem.submissions.map(sub => {
                                    const config = getStatusConfig(sub.status);
                                    const Icon = config.icon;
                                    return (
                                      <div key={sub.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/10 transition-colors">
                                        <div className="flex flex-col">
                                          <span className="text-sm font-medium text-foreground">{sub.user.name}</span>
                                          <span className="text-xs text-muted-foreground">{sub.user.email}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm">
                                          <Badge variant="outline" className={`${config.color} gap-1 shrink-0`}>
                                            <Icon className="w-3 h-3" /> {config.label}
                                          </Badge>
                                          <span className="font-mono text-muted-foreground w-12 text-right">{sub.score}%</span>
                                          <Link href={`/teacher/submissions/${sub.id}`} className="text-xs font-medium text-[#00A8E8] hover:underline ml-2">
                                            View &rarr;
                                          </Link>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
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
