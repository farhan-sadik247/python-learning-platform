import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ChevronLeft, Plus, Settings, Code } from "lucide-react";
import { notFound } from "next/navigation";
import { LessonActions } from "./lesson-actions";
import { CourseActions } from "./course-actions";
import { Badge } from "@/components/ui/badge";

export default async function TeacherCourseDetailsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const user = await requireRole(["TEACHER"]);
  const { courseId } = await params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      lessons: {
        orderBy: { order: "asc" },
        include: {
          _count: {
            select: { problems: true }
          }
        }
      },
    },
  });

  if (!course || course.teacherId !== user.id) {
    notFound();
  }

  // Fetch Basic Progress Info
  const lessonIds = course.lessons.map(l => l.id);
  
  // Get active students count
  const progresses = await prisma.progress.groupBy({
    by: ['userId'],
    where: { lessonId: { in: lessonIds } }
  });
  
  // Total completions
  const totalCompletions = await prisma.progress.count({
    where: { lessonId: { in: lessonIds }, completed: true }
  });
  
  // Find published problems attached to this course
  const publishedProblems = await prisma.problem.findMany({
    where: {
      isPublished: true,
      OR: [
        { courseId: course.id },
        { lessonId: { in: lessonIds } }
      ]
    },
    select: { id: true }
  });
  
  const problemIds = publishedProblems.map(p => p.id);
  
  const acceptedSubmissions = await prisma.submission.count({
    where: { problemId: { in: problemIds }, status: 'ACCEPTED' }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button render={<Link href="/teacher/courses" />} variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{course.title}</h2>
            <p className="text-muted-foreground text-sm line-clamp-1">{course.description || "No description provided."}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button render={<Link href={`/teacher/courses/${course.id}/edit`} />} variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <CourseActions courseId={course.id} />
        </div>
      </div>
      
      {/* Basic Analytics */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-background border-border">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Active Students</div>
            <div className="text-3xl font-bold font-mono text-foreground">{progresses.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-background border-border">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Lesson Completions</div>
            <div className="text-3xl font-bold font-mono text-foreground">{totalCompletions}</div>
          </CardContent>
        </Card>
        <Card className="bg-background border-border">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Problems Solved</div>
            <div className="text-3xl font-bold font-mono text-foreground">{acceptedSubmissions}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-foreground">Lessons</h3>
        <Button render={<Link href={`/teacher/courses/${course.id}/lessons/new`} />} className="bg-[#00A8E8] hover:bg-[#0077B6] text-foreground">
            <Plus className="mr-2 h-4 w-4" />
            Add Lesson
          </Button>
      </div>

      {course.lessons.length === 0 ? (
        <Card className="bg-background border-border">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">You haven&apos;t added any lessons to this course yet.</p>
            <Button render={<Link href={`/teacher/courses/${course.id}/lessons/new`} />} className="bg-[#00A8E8] hover:bg-[#0077B6] text-foreground">
                <Plus className="mr-2 h-4 w-4" />
                Add First Lesson
              </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {course.lessons.map((lesson, index) => (
            <Card key={lesson.id} className="bg-background border-border hover:border-slate-700 transition-colors">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-card text-muted-foreground text-sm font-medium border border-border shrink-0">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/teacher/courses/${course.id}/lessons/${lesson.id}`}
                      className="font-medium text-foreground hover:text-[#00A8E8] transition-colors truncate block"
                    >
                      {lesson.title}
                    </Link>
                    {lesson.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{lesson.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        className="text-xs text-muted-foreground border-border gap-1 h-5 px-1.5"
                      >
                        <Code className="w-3 h-3" />
                        {lesson._count.problems} {lesson._count.problems === 1 ? "Problem" : "Problems"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    render={<Link href={`/teacher/problems/new?lessonId=${lesson.id}`} />}
                    variant="outline"
                    size="sm"
                    className="border-[#00A8E8]/30 text-[#00A8E8] hover:bg-[#00A8E8]/10 hover:text-[#00A8E8]"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Problem
                  </Button>
                  <LessonActions
                    courseId={course.id}
                    lessonId={lesson.id}
                    isFirst={index === 0}
                    isLast={index === course.lessons.length - 1}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Floating Action Button */}
      {course.lessons.length > 0 && (
        <div className="fixed bottom-8 right-8 z-50 hidden md:block animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Button render={<Link href={`/teacher/courses/${course.id}/lessons/new`} />} size="icon" className="h-14 w-14 rounded-full shadow-lg shadow-[#00A8E8]/20 bg-[#00A8E8] hover:bg-[#0077B6] hover:scale-105 transition-all duration-200 text-white">
            <Plus className="h-6 w-6" />
            <span className="sr-only">Add Lesson</span>
          </Button>
        </div>
      )}
    </div>
  );
}
