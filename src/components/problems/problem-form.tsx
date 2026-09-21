"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { createProblemAction, updateProblemAction } from "@/app/actions/problems";
import { Loader2 } from "lucide-react";
import type { Problem } from "@/generated/prisma/client";

type LessonOption = { id: string; title: string; course: { title: string } };

interface ProblemFormProps {
  initialData?: Problem;
  lessons: LessonOption[];
  /** Pre-selects a lesson in the dropdown (server-validated by the page). */
  defaultLessonId?: string;
}

export function ProblemForm({ initialData, lessons, defaultLessonId }: ProblemFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setErrors({});
    
    const formData = new FormData(e.currentTarget);
    const isPublished = formData.get("isPublished") === "on";
    // We need to set it properly because checkbox might not send "off"
    formData.set("isPublished", isPublished ? "true" : "false");

    let result;
    if (initialData) {
      result = await updateProblemAction(initialData.id, null, formData);
    } else {
      result = await createProblemAction(null, formData);
    }

    if (result?.errors) {
      setErrors(result.errors);
      setIsPending(false);
    } else if (result?.message) {
      // successful update
      router.refresh();
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {errors.general && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-md text-sm">
          {errors.general.join(", ")}
        </div>
      )}

      <Card className="bg-background border-border">
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input 
              id="title" 
              name="title" 
              defaultValue={initialData?.title} 
              disabled={isPending}
              required
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lessonId">Lesson *</Label>
            <select
              id="lessonId"
              name="lessonId"
              defaultValue={initialData?.lessonId || defaultLessonId || ""}
              disabled={isPending}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="" disabled>Select a lesson</option>
              {lessons.map(lesson => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.course.title} &gt; {lesson.title}
                </option>
              ))}
            </select>
            {errors.lessonId && <p className="text-sm text-red-500">{errors.lessonId[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty *</Label>
            <select
              id="difficulty"
              name="difficulty"
              defaultValue={initialData?.difficulty || "EASY"}
              disabled={isPending}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="EASY">EASY</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HARD">HARD</option>
            </select>
            {errors.difficulty && <p className="text-sm text-red-500">{errors.difficulty[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea 
              id="description" 
              name="description" 
              defaultValue={initialData?.description} 
              disabled={isPending}
              rows={6}
              required
            />
            {errors.description && <p className="text-sm text-red-500">{errors.description[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="starterCode">Starter Code (Python)</Label>
            <Textarea 
              id="starterCode" 
              name="starterCode" 
              defaultValue={initialData?.starterCode || ""} 
              disabled={isPending}
              rows={4}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">Initial Python code provided to the student.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hints">Hints</Label>
            <Textarea 
              id="hints" 
              name="hints" 
              defaultValue={initialData?.hints || ""} 
              disabled={isPending}
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input 
              type="checkbox" 
              id="isPublished" 
              name="isPublished" 
              defaultChecked={initialData ? initialData.isPublished : true} 
              disabled={isPending}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="isPublished">Published (visible to students)</Label>
          </div>
          {/* Pass lesson context for redirect — the server action validates this independently */}
          {!initialData && defaultLessonId && (
            <input type="hidden" name="returnToLesson" value={defaultLessonId} />
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isPending}
          className="bg-[#00A8E8] hover:bg-[#0077B6] text-foreground"
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Save Changes" : "Create Problem"}
        </Button>
      </div>
    </form>
  );
}
