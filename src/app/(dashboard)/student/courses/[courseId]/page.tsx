import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ChevronLeft, CheckCircle, PlayCircle } from "lucide-react";
import { notFound } from "next/navigation";

export default async function StudentCourseDetailsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const user = await requireRole(["STUDENT"]);
  const { courseId } = await params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      teacher: { select: { name: true } },
      lessons: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!course) {
    notFound();
  }

  // Get user's progress for this course's lessons
  const progressRecords = await prisma.progress.findMany({
    where: {
      userId: user.id,
      lessonId: { in: course.lessons.map(l => l.id) },
    }
  });

  const completedLessonIds = new Set(
    progressRecords.filter(p => p.completed).map(p => p.lessonId)
  );

  const completedCount = completedLessonIds.size;
  const totalLessons = course.lessons.length;

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
          <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3 shrink-0">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-medium">Your Progress</span>
              <span className="text-lg font-bold text-foreground">
                {completedCount} / {totalLessons}
              </span>
            </div>
            {completedCount === totalLessons && totalLessons > 0 && (
              <CheckCircle className="h-6 w-6 text-green-500 ml-2" />
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold text-foreground mb-4">Lessons</h3>
        
        {totalLessons === 0 ? (
          <Card className="bg-background border-border">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">This course doesn&apos;t have any lessons yet.</p>
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

              let activeSectionIndex = sections.findIndex(([_, sectionLessons]) => {
                return sectionLessons.some(lesson => !completedLessonIds.has(lesson.id));
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
                    const isCompleted = completedLessonIds.has(lesson.id);
                    
                    return (
                      <Link key={lesson.id} href={`/student/courses/${course.id}/lessons/${lesson.id}`} className="block hover:bg-card transition-colors">
                        <div className="flex items-center p-4 pl-12">
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
                    );
                  })}
                </div>
              </details>
            ))
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
