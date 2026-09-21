"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateCourseAction, ActionState } from "@/app/actions/courses";

interface AdminCourseFormProps {
  course: {
    id: string;
    title: string;
    description: string | null;
    teacherId: string;
  };
  teachers: {
    id: string;
    name: string;
    email: string;
  }[];
}

export function AdminCourseForm({ course, teachers }: AdminCourseFormProps) {
  const updateCourseWithId = updateCourseAction.bind(null, course.id);

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateCourseWithId,
    null
  );

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      {state?.errors?.general && (
        <div className="p-3 text-sm font-medium bg-destructive/10 text-destructive rounded-md border border-destructive/20">
          {state.errors.general[0]}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title" className="text-muted-foreground">Course Title</Label>
        <Input 
          id="title" 
          name="title" 
          defaultValue={course.title} 
          className="bg-background border-border text-foreground"
        />
        {state?.errors?.title && (
          <p className="text-sm text-destructive">{state.errors.title[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-muted-foreground">Description</Label>
        <Textarea 
          id="description" 
          name="description" 
          defaultValue={course.description || ""} 
          className="bg-background border-border text-foreground min-h-[120px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="teacherId" className="text-muted-foreground">Assigned Teacher</Label>
        <select 
          id="teacherId" 
          name="teacherId" 
          defaultValue={course.teacherId}
          className="w-full bg-background border border-border text-foreground rounded-md h-10 px-3 outline-none focus:ring-2 focus:ring-[#00A8E8]"
        >
          {teachers.map(teacher => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.name} ({teacher.email})
            </option>
          ))}
        </select>
      </div>

      <Button 
        type="submit" 
        disabled={isPending}
        className="bg-[#00A8E8] hover:bg-[#0077B6] text-foreground w-full sm:w-auto"
      >
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
