import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { BookOpen, FileCode, Users, Activity } from "lucide-react";

export const metadata = {
  title: "Teacher Dashboard | Python Learning Platform",
};

export default async function TeacherDashboardPage() {
  await requireRole(["TEACHER"]);

  const [totalCourses, totalLessons, totalStudents] = await Promise.all([
    prisma.course.count(),
    prisma.lesson.count(),
    prisma.user.count({ where: { role: "STUDENT" } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Teacher Dashboard</h2>
        <p className="text-slate-400 mt-1">Create lessons, practice problems, and track student progress.</p>
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
          value="Coming Soon"
          icon={<FileCode className="h-4 w-4" />}
        />
        <StatCard
          title="Total Students"
          value={totalStudents}
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">My Courses</h3>
          <EmptyState
            icon={BookOpen}
            title="No courses created yet"
            description="Courses you create will appear here."
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Recent Student Activity</h3>
          <EmptyState
            icon={Activity}
            title="No student activity yet"
            description="Student progress and activity will appear here once they start learning."
          />
        </div>
      </div>
    </div>
  );
}
