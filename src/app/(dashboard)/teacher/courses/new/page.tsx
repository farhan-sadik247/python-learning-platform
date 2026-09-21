import { requireRole } from "@/lib/auth";
import { CourseForm } from "../course-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function NewCoursePage() {
  await requireRole(["TEACHER"]);

  return (
    <div className="space-y-6">
      <div>
        <Button render={<Link href="/teacher/courses" />} variant="ghost" className="mb-4 text-muted-foreground hover:text-foreground hover:bg-card -ml-4">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Button>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Create Course</h2>
        <p className="text-muted-foreground">Add a new Python course to your curriculum.</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <CourseForm />
      </div>
    </div>
  );
}
