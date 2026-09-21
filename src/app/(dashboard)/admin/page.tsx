import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Users, GraduationCap, BookOpen, Activity, FileCode, CheckCircle, Settings } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export const metadata = {
  title: "Admin Dashboard | Python Learning Platform",
};

export default async function AdminDashboardPage() {
  await requireRole(["ADMIN"]);

  const [
    totalUsers, 
    totalTeachers, 
    totalStudents, 
    totalCourses, 
    totalLessons, 
    totalPublishedProblems, 
    totalSubmissions,
    totalAcceptedSubmissions,
    recentSubmissions
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { roleAssignments: { some: { role: "TEACHER" } } } }),
    prisma.user.count({ where: { roleAssignments: { some: { role: "STUDENT" } } } }),
    prisma.course.count(),
    prisma.lesson.count(),
    prisma.problem.count({ where: { isPublished: true } }),
    prisma.submission.count(),
    prisma.submission.count({ where: { status: 'ACCEPTED' } }),
    prisma.submission.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        problem: { select: { title: true } }
      }
    })
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Admin Dashboard</h2>
        <p className="text-muted-foreground mt-1">Platform-wide statistics and learning analytics.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={totalUsers}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          title="Teachers"
          value={totalTeachers}
          icon={<GraduationCap className="h-4 w-4" />}
        />
        <StatCard
          title="Students"
          value={totalStudents}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          title="Courses"
          value={totalCourses}
          icon={<BookOpen className="h-4 w-4" />}
        />
        <StatCard
          title="Lessons"
          value={totalLessons}
          icon={<BookOpen className="h-4 w-4" />}
        />
        <StatCard
          title="Published Problems"
          value={totalPublishedProblems}
          icon={<FileCode className="h-4 w-4" />}
        />
        <StatCard
          title="Total Submissions"
          value={totalSubmissions}
          icon={<Activity className="h-4 w-4" />}
        />
        <StatCard
          title="Accepted Solutions"
          value={totalAcceptedSubmissions}
          icon={<CheckCircle className="h-4 w-4 text-green-500" />}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">Platform Settings</h3>
          <div className="grid gap-4">
            <EmptyState
              icon={Settings}
              title="Platform Settings"
              description="Platform configuration and global settings are coming soon."
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-foreground">Recent Submissions</h3>
            <Link href="/admin/submissions" className="text-sm text-[#00A8E8] hover:underline">
              View all
            </Link>
          </div>
          
          {recentSubmissions.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No recent activity"
              description="No coding submissions have been made yet."
            />
          ) : (
            <div className="border border-border rounded-lg bg-card overflow-hidden">
              <div className="divide-y divide-border">
                {recentSubmissions.map((sub) => (
                  <Link key={sub.id} href={`/admin/submissions/${sub.id}`} className="block hover:bg-muted/50 p-4 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-foreground line-clamp-1">{sub.problem.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          By {sub.user.name} • {formatDistanceToNow(new Date(sub.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {sub.status === 'ACCEPTED' ? (
                           <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                           <div className="h-2 w-2 rounded-full bg-red-500" />
                        )}
                        <span className="text-xs font-mono text-muted-foreground">{sub.score} pts</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
