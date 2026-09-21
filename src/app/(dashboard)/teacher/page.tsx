import { requireRole, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { BookOpen, FileCode, Users, Activity, Code } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

export const metadata = {
  title: "Teacher Dashboard | Python Learning Platform",
};

export default async function TeacherDashboardPage() {
  await requireRole(["TEACHER"]);
  const user = await getCurrentUser();
  if (!user) return null;

  const [totalCourses, totalLessons, totalProblems, recentSubmissions] = await Promise.all([
    prisma.course.count({ where: { teacherId: user.id } }),
    prisma.lesson.count({ where: { course: { teacherId: user.id } } }),
    prisma.problem.count({ where: { createdById: user.id } }),
    prisma.submission.findMany({
      where: { problem: { createdById: user.id } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: { select: { name: true, email: true } },
        problem: { select: { title: true } }
      }
    })
  ]);

  const totalStudents = await prisma.user.count({ where: { roleAssignments: { some: { role: "STUDENT" } } } });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Teacher Dashboard</h2>
        <p className="text-muted-foreground mt-1">Create lessons, practice problems, and track student progress.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Courses"
          value={totalCourses}
          icon={<BookOpen className="h-4 w-4" />}
        />
        <StatCard
          title="Lessons"
          value={totalLessons}
          icon={<FileCode className="h-4 w-4" />}
        />
        <StatCard
          title="Problems"
          value={totalProblems}
          icon={<Code className="h-4 w-4" />}
        />
        <StatCard
          title="Total Students"
          value={totalStudents}
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">My Courses</h3>
          {totalCourses === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No courses created yet"
              description="Courses you create will appear here."
            />
          ) : (
            <div className="border border-border rounded-md bg-card p-6 flex flex-col items-center justify-center text-center space-y-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">You have {totalCourses} course(s). Manage them from the Courses tab.</p>
              <Link href="/teacher/courses">
                <Button variant="outline">View Courses</Button>
              </Link>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">Recent Student Activity</h3>
          {recentSubmissions.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No student activity yet"
              description="Student progress and activity will appear here once they start learning."
            />
          ) : (
            <div className="border border-border rounded-md bg-card overflow-hidden divide-y divide-border">
              {recentSubmissions.map((sub) => (
                <div key={sub.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="font-medium text-foreground text-sm truncate">{sub.user.name}</span>
                    <span className="text-xs text-muted-foreground truncate">{sub.problem.title}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-xs font-semibold ${sub.status === 'ACCEPTED' ? 'text-green-500' : 'text-red-500'}`}>
                      {sub.status === 'ACCEPTED' ? 'Accepted' : 'Failed'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(sub.createdAt, { addSuffix: true })}</span>
                  </div>
                </div>
              ))}
              <div className="p-3 bg-muted/30 border-t border-border flex justify-center">
                <Link href="/teacher/submissions" className="text-xs font-medium text-[#00A8E8] hover:underline">
                  View all submissions &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
