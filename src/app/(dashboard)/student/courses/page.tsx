import { requireRole, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Trophy } from "lucide-react";
import { getStudentCourseProgress } from "@/lib/progress";

export default async function StudentCoursesPage() {
  await requireRole(["STUDENT"]);
  const user = await getCurrentUser();
  if (!user) return null;

  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      teacher: { select: { name: true } }
    }
  });

  const coursesWithProgress = await Promise.all(
    courses.map(async (course) => {
      const progress = await getStudentCourseProgress(user.id, course.id);
      return { ...course, progress };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Available Courses</h2>
        <p className="text-muted-foreground">Browse and start learning Python today.</p>
      </div>

      {coursesWithProgress.length === 0 ? (
        <Card className="bg-background border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-card p-4 mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No courses available yet</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Your teachers haven&apos;t published any courses yet. Check back later!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {coursesWithProgress.map((course) => (
            <Card key={course.id} className="bg-background border-border hover:border-slate-700 transition-colors flex flex-col">
              <CardHeader>
                <CardTitle className="text-foreground line-clamp-1">{course.title}</CardTitle>
                <CardDescription className="text-muted-foreground line-clamp-2 min-h-10">
                  {course.description || "No description provided."}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <div className="flex items-center text-sm text-muted-foreground mb-4">
                  By <span className="font-medium text-muted-foreground ml-1">{course.teacher.name}</span>
                </div>
                
                {/* Progress Stats */}
                <div className="flex flex-col gap-2 mb-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {course.progress.completedLessons}/{course.progress.totalLessons} Lessons</span>
                    <span className="flex items-center gap-1"><Trophy className="w-3 h-3" /> {course.progress.solvedProblems}/{course.progress.totalPublishedProblems} Problems</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${course.progress.overallPercentage}%` }} />
                  </div>
                  <div className="text-right text-xs font-medium text-foreground">{course.progress.overallPercentage}% Completed</div>
                </div>

                <div className="flex items-center justify-between">
                  <Button render={<Link href={`/student/courses/${course.id}`} />} variant="outline" size="sm" className="bg-[#00A8E8]/10 border-[#00A8E8]/30 text-[#00A8E8] hover:text-[#00A8E8] hover:bg-[#00A8E8]/20 w-full">
                      View Course
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
