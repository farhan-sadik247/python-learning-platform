import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, User as UserIcon, Calendar, BookOpen, Code, FileCode, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { UserRoleManager } from "@/components/users/user-role-manager";
import { formatDistanceToNow } from "date-fns";
import type { SubmissionStatus } from "@/generated/prisma/client";

export const metadata = {
  title: "User Details | Admin Dashboard",
};

export function getStatusConfig(status: SubmissionStatus) {
  switch (status) {
    case "ACCEPTED":
      return { label: "Accepted", color: "text-green-500", icon: CheckCircle };
    case "WRONG_ANSWER":
      return { label: "Wrong Answer", color: "text-red-500", icon: XCircle };
    default:
      return { label: status, color: "text-muted-foreground", icon: XCircle };
  }
}

export default async function AdminUserDetailsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireRole(["ADMIN"]);
  
  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roleAssignments: true,
      _count: {
        select: {
          teacherCourses: true,
          createdProblems: true,
          submissions: true,
        }
      },
      submissions: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          problem: {
            select: { id: true, title: true }
          }
        }
      }
    }
  });

  if (!user) {
    notFound();
  }

  const assignedRoles = user.roleAssignments.map(ra => ra.role);
  const isTeacher = assignedRoles.includes("TEACHER");
  const isStudent = assignedRoles.includes("STUDENT");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button render={<Link href="/admin/users" />} variant="outline" size="icon" className="h-8 w-8 rounded-full border-border">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{user.name}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Basic Info & Role Management */}
        <div className="space-y-6 md:col-span-1">
          <Card className="bg-background border-border">
            <CardHeader>
              <CardTitle className="text-lg">Profile Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <UserIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Joined</span>
                  <span className="text-foreground font-medium">{user.createdAt.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">ID</span>
                  <span className="text-xs text-foreground font-mono truncate max-w-[120px]">{user.id}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <UserRoleManager userId={user.id} assignedRoles={assignedRoles} />
        </div>

        {/* Right Column: Platform Activity */}
        <div className="space-y-6 md:col-span-2">
          {/* Teacher Stats */}
          {isTeacher && (
            <Card className="bg-background border-border">
              <CardHeader>
                <CardTitle className="text-lg">Teacher Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-4 rounded-lg border border-border flex flex-col items-center justify-center text-center">
                    <BookOpen className="h-6 w-6 text-purple-500 mb-2" />
                    <span className="text-2xl font-bold text-foreground">{user._count.teacherCourses}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Courses Created</span>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg border border-border flex flex-col items-center justify-center text-center">
                    <Code className="h-6 w-6 text-purple-500 mb-2" />
                    <span className="text-2xl font-bold text-foreground">{user._count.createdProblems}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Problems Created</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Student Stats & Submissions */}
          {isStudent && (
            <Card className="bg-background border-border">
              <CardHeader>
                <CardTitle className="text-lg">Student Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/30 p-4 rounded-lg border border-border flex flex-col items-center justify-center text-center">
                  <FileCode className="h-6 w-6 text-blue-500 mb-2" />
                  <span className="text-2xl font-bold text-foreground">{user._count.submissions}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Total Submissions</span>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">Recent Submissions</h4>
                  {user.submissions.length === 0 ? (
                    <p className="text-sm text-muted-foreground border border-border rounded-md p-4 text-center bg-card">No submissions yet.</p>
                  ) : (
                    <div className="border border-border rounded-md bg-card overflow-hidden divide-y divide-border">
                      {user.submissions.map(sub => {
                        const config = getStatusConfig(sub.status);
                        const Icon = config.icon;
                        return (
                          <div key={sub.id} className="p-3 flex items-center justify-between text-sm hover:bg-muted/10 transition-colors">
                            <div className="flex flex-col gap-1 min-w-0">
                              <span className="font-medium text-foreground truncate">{sub.problem.title}</span>
                              <span className="text-xs text-muted-foreground">{formatDistanceToNow(sub.createdAt, { addSuffix: true })}</span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className={`flex items-center gap-1 text-xs font-medium ${config.color}`}>
                                <Icon className="h-3 w-3" /> {config.label}
                              </span>
                              <span className="font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded text-xs">{sub.score}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {!isTeacher && !isStudent && (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-border rounded-lg bg-card">
              <UserIcon className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">This user has no active Teacher or Student roles.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
