import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Users, GraduationCap, BookOpen, Activity, Settings } from "lucide-react";

export const metadata = {
  title: "Admin Dashboard | Python Learning Platform",
};

export default async function AdminDashboardPage() {
  await requireRole(["ADMIN"]);

  const [totalUsers, totalTeachers, totalStudents, totalCourses] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.course.count(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Admin Dashboard</h2>
        <p className="text-slate-400 mt-1">Manage your Python Learning Platform.</p>
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
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Quick Actions</h3>
          <div className="grid gap-4">
            <EmptyState
              icon={Settings}
              title="Platform Settings"
              description="Platform configuration and settings are coming soon."
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Recent Activity</h3>
          <EmptyState
            icon={Activity}
            title="No recent activity"
            description="Recent platform activity will appear here once the system is fully implemented."
          />
        </div>
      </div>
    </div>
  );
}
