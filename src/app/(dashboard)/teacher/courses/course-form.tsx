"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCourseAction, updateCourseAction, ActionState } from "@/app/actions/courses";

interface CourseFormProps {
  course?: {
    id: string;
    title: string;
    description: string | null;
  };
}

export function CourseForm({ course }: CourseFormProps) {
  const updateCourseWithId = course 
    ? updateCourseAction.bind(null, course.id)
    : createCourseAction;

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
          defaultValue={course?.title || ""} 
          placeholder="e.g. Introduction to Python"
          className="bg-background border-border text-foreground"
        />
        {state?.errors?.title && (
          <p className="text-sm text-destructive">{state.errors.title[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-muted-foreground">Description (Optional)</Label>
        <Textarea 
          id="description" 
          name="description" 
          defaultValue={course?.description || ""} 
          placeholder="What will students learn?"
          className="bg-background border-border text-foreground min-h-[120px]"
        />
      </div>

      <Button 
        type="submit" 
        disabled={isPending}
        className="bg-[#00A8E8] hover:bg-[#0077B6] text-foreground w-full sm:w-auto"
      >
        {isPending ? "Saving..." : course ? "Save Changes" : "Create Course"}
      </Button>
    </form>
  );
}
