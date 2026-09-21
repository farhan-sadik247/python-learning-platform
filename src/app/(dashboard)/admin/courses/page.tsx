import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, BookOpen } from "lucide-react";

export default async function AdminCoursesPage() {
  await requireRole(["ADMIN"]);

  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      teacher: { select: { name: true, email: true } },
      _count: { select: { lessons: true } }
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Platform Courses</h2>
        <p className="text-muted-foreground">Manage all courses and teacher assignments.</p>
      </div>

      {courses.length === 0 ? (
        <Card className="bg-background border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-card p-4 mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No courses have been created yet</h3>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} className="bg-background border-border hover:border-slate-700 transition-colors flex flex-col">
              <CardHeader>
                <CardTitle className="text-foreground line-clamp-1">{course.title}</CardTitle>
                <CardDescription className="text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                  {course.description || "No description provided."}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <div className="flex flex-col text-sm text-muted-foreground mb-4">
                  <span>Teacher: <span className="font-medium text-muted-foreground">{course.teacher.name}</span></span>
                  <span className="text-xs text-muted-foreground">{course.teacher.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground font-medium">
                    {course._count.lessons} {course._count.lessons === 1 ? 'Lesson' : 'Lessons'}
                  </span>
                  <Button render={<Link href={`/admin/courses/${course.id}`} />} variant="outline" size="sm" className="border-border text-muted-foreground hover:text-foreground hover:bg-card">
                      <Settings className="h-4 w-4 mr-2" />
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
