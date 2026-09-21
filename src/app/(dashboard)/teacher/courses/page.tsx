import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, BookOpen } from "lucide-react";

export default async function TeacherCoursesPage() {
  const user = await requireRole(["TEACHER"]);

  const courses = await prisma.course.findMany({
    where: { teacherId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { lessons: true }
      }
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">My Courses</h2>
          <p className="text-muted-foreground">Manage your Python courses and lessons.</p>
        </div>
        <Button render={<Link href="/teacher/courses/new" />} className="bg-[#00A8E8] hover:bg-[#0077B6] text-foreground">
            <Plus className="mr-2 h-4 w-4" />
            Create Course
          </Button>
      </div>

      {courses.length === 0 ? (
        <Card className="bg-background border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-card p-4 mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No courses yet</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Create your first Python course to start building your lessons.
            </p>
            <Button render={<Link href="/teacher/courses/new" />} className="bg-[#00A8E8] hover:bg-[#0077B6] text-foreground">
                <Plus className="mr-2 h-4 w-4" />
                Create Course
              </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} className="bg-background border-border hover:border-slate-700 transition-colors">
              <CardHeader>
                <CardTitle className="text-foreground line-clamp-1">{course.title}</CardTitle>
                <CardDescription className="text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                  {course.description || "No description provided."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground font-medium">
                    {course._count.lessons} {course._count.lessons === 1 ? 'Lesson' : 'Lessons'}
                  </span>
                  <Button render={<Link href={`/teacher/courses/${course.id}`} />} variant="outline" size="sm" className="border-border text-muted-foreground hover:text-foreground hover:bg-card">
                      Manage
                    </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
