import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { BookOpen, CheckCircle, Code, Activity } from "lucide-react";
import { getStudentOverallProgress } from "@/lib/progress";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { getStatusConfig } from "@/components/submissions/submission-list";

export const metadata = {
  title: "Student Dashboard | Python Learning Platform",
};

export default async function StudentDashboardPage() {
  const user = await requireRole(["STUDENT"]);

  const totalAvailableCourses = await prisma.course.count();
  const overallProgress = await getStudentOverallProgress(user.id);
  
  const recentSubmissions = await prisma.submission.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { problem: { select: { title: true } } }
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
          value={overallProgress.completedLessons}
          description={`Out of ${overallProgress.totalLessons} available`}
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <StatCard
          title="Problems Solved"
          value={overallProgress.solvedProblems}
          description={`Out of ${overallProgress.totalPublishedProblems} published`}
          icon={<Code className="h-4 w-4" />}
        />
        <StatCard
          title="Overall Learning"
          value={`${overallProgress.overallPercentage}%`}
          icon={<Activity className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">Continue Learning</h3>
          <div className="border border-border rounded-lg bg-card p-6 flex flex-col items-center justify-center text-center space-y-3">
            <div className="bg-primary/10 p-3 rounded-full">
              <BookOpen className="w-6 h-6 text-[#00A8E8]" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-foreground">Browse available courses</h4>
              <p className="text-sm text-muted-foreground">Go to Available Courses to start learning!</p>
            </div>
            <Link href="/student/courses" className="text-sm font-medium text-primary hover:underline mt-2">
              View Courses
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-foreground">Recent Submissions</h3>
            <Link href="/student/submissions" className="text-sm text-[#00A8E8] hover:underline">
              View all
            </Link>
          </div>
          
          {recentSubmissions.length === 0 ? (
            <EmptyState
              icon={Code}
              title="No submissions yet"
              description="Your coding submissions will appear here."
            />
          ) : (
            <div className="border border-border rounded-lg bg-card overflow-hidden">
              <div className="divide-y divide-border">
                {recentSubmissions.map(sub => {
                  const config = getStatusConfig(sub.status);
                  const Icon = config.icon;
                  return (
                    <Link key={sub.id} href={`/student/submissions/${sub.id}`} className="block hover:bg-muted/50 p-4 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-foreground line-clamp-1">{sub.problem.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(sub.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                           <div className={`text-xs flex items-center gap-1 font-medium ${config.color.split(' ')[1]}`}>
                             <Icon className="h-3 w-3" />
                             {config.label}
                           </div>
                           <div className="text-xs font-mono text-muted-foreground">Score: {sub.score}</div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
