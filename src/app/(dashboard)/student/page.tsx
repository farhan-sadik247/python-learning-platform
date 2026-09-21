import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { BookOpen, CheckCircle, Code, Activity } from "lucide-react";

export const metadata = {
  title: "Student Dashboard | Python Learning Platform",
};

export default async function StudentDashboardPage() {
  const user = await requireRole(["STUDENT"]);

  const totalAvailableCourses = await prisma.course.count();
  const completedLessons = await prisma.progress.count({
    where: {
      userId: user.id,
      completed: true,
    }
  });

  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome back, {firstName}</h2>
        <p className="text-muted-foreground mt-1">Continue learning Python and keep building your skills.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Available Courses"
          value={totalAvailableCourses}
          icon={<BookOpen className="h-4 w-4" />}
        />
        <StatCard
          title="Lessons Completed"
          value={completedLessons}
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <StatCard
          title="Problems Solved"
          value="Coming Soon"
          icon={<Code className="h-4 w-4" />}
        />
        <StatCard
          title="Current Progress"
          value="Coming Soon"
          icon={<Activity className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">Continue Learning</h3>
          <EmptyState
            icon={BookOpen}
            title="No lessons available yet"
            description="When you start a course, your current lesson will appear here."
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">Your Progress</h3>
          <EmptyState
            icon={Activity}
            title="No progress yet"
            description="Your learning progress will be tracked here once you start completing lessons."
          />
        </div>
      </div>
    </div>
  );
}
