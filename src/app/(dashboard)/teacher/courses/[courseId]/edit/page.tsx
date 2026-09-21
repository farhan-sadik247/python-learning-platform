import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CourseForm } from "../../course-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const user = await requireRole(["TEACHER"]);
  const { courseId } = await params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course || course.teacherId !== user.id) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Button render={<Link href={`/teacher/courses/${courseId}`} />} variant="ghost" className="mb-4 text-muted-foreground hover:text-foreground hover:bg-card -ml-4">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Button>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Edit Course</h2>
        <p className="text-muted-foreground">Update course details.</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <CourseForm course={course} />
      </div>
    </div>
  );
}
