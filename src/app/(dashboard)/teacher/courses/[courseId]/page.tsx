import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ChevronLeft, Plus, Pencil, Settings } from "lucide-react";
import { notFound } from "next/navigation";
import { LessonActions } from "./lesson-actions";
import { CourseActions } from "./course-actions";

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
      },
    },
  });

  if (!course || course.teacherId !== user.id) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Button render={<Link href="/teacher/courses" />} variant="ghost" className="mb-4 text-muted-foreground hover:text-foreground hover:bg-card -ml-4">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Button>
        
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{course.title}</h2>
            <p className="text-muted-foreground mt-1 max-w-2xl">{course.description || "No description provided."}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button render={<Link href={`/teacher/courses/${course.id}/edit`} />} variant="outline" className="border-border text-muted-foreground hover:text-foreground hover:bg-card">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            <CourseActions courseId={course.id} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-8">
        <h3 className="text-xl font-semibold text-foreground">Lessons</h3>
        <Button render={<Link href={`/teacher/courses/${course.id}/lessons/new`} />} className="bg-[#00A8E8] hover:bg-[#0077B6] text-foreground">
            <Plus className="mr-2 h-4 w-4" />
            Add Lesson
          </Button>
      </div>

      {course.lessons.length === 0 ? (
        <Card className="bg-background border-border">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">You haven't added any lessons to this course yet.</p>
            <Button render={<Link href={`/teacher/courses/${course.id}/lessons/new`} />} className="bg-[#00A8E8] hover:bg-[#0077B6] text-foreground">
                <Plus className="mr-2 h-4 w-4" />
                Add First Lesson
              </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {course.lessons.map((lesson, index) => (
            <Card key={lesson.id} className="bg-background border-border">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-card text-muted-foreground text-sm font-medium border border-border">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="text-foreground font-medium">{lesson.title}</h4>
                    {lesson.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{lesson.description}</p>
                    )}
                  </div>
                </div>
                <LessonActions 
                  courseId={course.id} 
                  lessonId={lesson.id} 
                  isFirst={index === 0} 
                  isLast={index === course.lessons.length - 1} 
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
