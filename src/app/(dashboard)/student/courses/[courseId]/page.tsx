import { requireRole, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ChevronLeft, CheckCircle, PlayCircle, Code, Trophy } from "lucide-react";
import { notFound } from "next/navigation";
import { getStudentCourseProgress } from "@/lib/progress";

export default async function StudentCourseDetailsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  await requireRole(["STUDENT"]);
  const user = await getCurrentUser();
  if (!user) return null;
  const { courseId } = await params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      teacher: { select: { name: true } },
      lessons: {
        orderBy: { order: "asc" },
        include: {
          problems: {
            where: { isPublished: true },
            orderBy: { order: "asc" }
          }
        }
      },
      problems: { // Problems not attached to a specific lesson, if any
        where: { isPublished: true, lessonId: null },
        orderBy: { order: "asc" }
      }
    },
  });

  if (!course) {
    notFound();
  }

  const progress = await getStudentCourseProgress(user.id, course.id);
  const completedLessonIdsSet = new Set(progress.completedLessonIds);
  const solvedProblemIdsSet = new Set(progress.solvedProblemIds);

  return (
    <div className="space-y-6">
      <div>
        <Button render={<Link href="/student/courses" />} variant="ghost" className="mb-4 text-muted-foreground hover:text-foreground hover:bg-card -ml-4">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Courses
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{course.title}</h2>
            <div className="flex items-center text-sm text-muted-foreground mt-1 mb-3">
              By <span className="font-medium text-muted-foreground ml-1">{course.teacher.name}</span>
            </div>
            <p className="text-muted-foreground max-w-2xl">{course.description || "No description provided."}</p>
          </div>
          
          {/* Detailed Progress UI */}
          <div className="flex flex-col gap-3 bg-card border border-border rounded-lg px-6 py-4 shrink-0 min-w-[250px]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Course Progress</span>
              <span className="text-sm font-bold text-foreground">{progress.overallPercentage}%</span>
            </div>
            
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${progress.overallPercentage}%` }} />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium uppercase">Lessons</span>
                <span className="text-sm font-bold text-foreground">
                  {progress.completedLessons} / {progress.totalLessons}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium uppercase">Problems</span>
                <span className="text-sm font-bold text-foreground">
                  {progress.solvedProblems} / {progress.totalPublishedProblems}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold text-foreground mb-4">Course Content</h3>
        
        {progress.totalLessons === 0 && progress.totalPublishedProblems === 0 ? (
          <Card className="bg-background border-border">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">This course doesn&apos;t have any content yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {(() => {
              const sections = Object.entries(
                course.lessons.reduce((acc, lesson) => {
                  const section = lesson.section || "General";
                  if (!acc[section]) acc[section] = [];
                  acc[section].push(lesson);
                  return acc;
                }, {} as Record<string, typeof course.lessons>)
              );

              let activeSectionIndex = sections.findIndex(([, sectionLessons]) => {
                return sectionLessons.some(lesson => !completedLessonIdsSet.has(lesson.id));
              });

              if (activeSectionIndex === -1) {
                activeSectionIndex = 0;
              }

              return sections.map(([section, sectionLessons], sectionIndex) => (
                <details key={section} className="group bg-background border border-border rounded-lg overflow-hidden" open={sectionIndex === activeSectionIndex}>
                <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-card transition-colors list-none [&::-webkit-details-marker]:hidden">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-muted-foreground" />
                    <h4 className="text-foreground font-medium">{section}</h4>
                  </div>
                  <ChevronLeft className="h-5 w-5 text-muted-foreground -rotate-90 group-open:rotate-90 transition-transform" />
                </summary>
                
                <div className="border-t border-border divide-y divide-border">
                  {sectionLessons.map((lesson) => {
                    const isCompleted = completedLessonIdsSet.has(lesson.id);
                    
                    return (
                      <div key={lesson.id}>
                        <Link href={`/student/courses/${course.id}/lessons/${lesson.id}`} className="block hover:bg-card transition-colors">
                          <div className="flex items-center p-4 pl-12 bg-background">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {isCompleted ? (
                                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                              ) : (
                                <div className="h-4 w-4 rounded-full border border-muted-foreground shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="text-foreground text-sm font-medium truncate">{lesson.title}</p>
                              </div>
                            </div>
                            <PlayCircle className="h-4 w-4 text-muted-foreground shrink-0 ml-4" />
                          </div>
                        </Link>
                        
                        {/* Problems for this lesson */}
                        {lesson.problems.length > 0 && (
                          <div className="border-t border-border/50 divide-y divide-border/50 bg-card">
                            {lesson.problems.map(problem => {
                              const isSolved = solvedProblemIdsSet.has(problem.id);
                              return (
                                <Link key={problem.id} href={`/student/problems/${problem.id}`} className="block hover:bg-muted/50 transition-colors">
                                  <div className="flex items-center p-3 pl-20">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      {isSolved ? (
                                        <Trophy className="h-4 w-4 text-yellow-500 shrink-0" />
                                      ) : (
                                        <Code className="h-4 w-4 text-muted-foreground shrink-0" />
                                      )}
                                      <div className="min-w-0 flex items-center gap-2">
                                        <p className="text-muted-foreground text-sm truncate">{problem.title}</p>
                                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-background border border-border text-muted-foreground">
                                          {problem.difficulty}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </Link>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </details>
            ))
            })()}

            {course.problems.length > 0 && (
               <details className="group bg-background border border-border rounded-lg overflow-hidden" open={true}>
                 <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-card transition-colors list-none [&::-webkit-details-marker]:hidden">
                   <div className="flex items-center gap-3">
                     <Trophy className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h4 className="text-foreground font-medium text-sm">Unassigned Problems</h4>
                        <p className="text-xs text-muted-foreground">These problems are not attached to a specific lesson.</p>
                      </div>
                   </div>
                   <ChevronLeft className="h-5 w-5 text-muted-foreground -rotate-90 group-open:rotate-90 transition-transform" />
                 </summary>
                 <div className="border-t border-border divide-y divide-border bg-card">
                    {course.problems.map(problem => {
                      const isSolved = solvedProblemIdsSet.has(problem.id);
                      return (
                        <Link key={problem.id} href={`/student/problems/${problem.id}`} className="block hover:bg-muted/50 transition-colors">
                          <div className="flex items-center p-3 pl-12">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {isSolved ? (
                                <Trophy className="h-4 w-4 text-yellow-500 shrink-0" />
                              ) : (
                                <Code className="h-4 w-4 text-muted-foreground shrink-0" />
                              )}
                              <div className="min-w-0 flex items-center gap-2">
                                <p className="text-foreground text-sm font-medium truncate">{problem.title}</p>
                                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-background border border-border text-muted-foreground">
                                  {problem.difficulty}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                 </div>
               </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
