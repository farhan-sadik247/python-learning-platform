import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminCourseForm } from "./admin-course-form";
import { CourseActions } from "../../../teacher/courses/[courseId]/course-actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";

export default async function AdminCourseDetailsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  await requireRole(["ADMIN"]);
  const { courseId } = await params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    notFound();
  }

  // Get all TEACHERs for assignment dropdown
  const teachers = await prisma.user.findMany({
    where: { roleAssignments: { some: { role: "TEACHER" } } },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <Button render={<Link href="/admin/courses" />} variant="ghost" className="mb-4 text-muted-foreground hover:text-foreground hover:bg-card -ml-4">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Button>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Manage Course</h2>
            <p className="text-muted-foreground">Update course details and teacher assignment.</p>
          </div>
          <CourseActions courseId={course.id} />
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <AdminCourseForm course={course} teachers={teachers} />
      </div>
    </div>
  );
}
