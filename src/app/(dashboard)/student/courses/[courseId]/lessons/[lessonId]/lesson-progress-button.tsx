"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Circle } from "lucide-react";
import { toggleLessonProgressAction } from "@/app/actions/progress";

interface LessonProgressButtonProps {
  courseId: string;
  lessonId: string;
  isCompleted: boolean;
}

export function LessonProgressButton({ courseId, lessonId, isCompleted }: LessonProgressButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      await toggleLessonProgressAction(courseId, lessonId, !isCompleted);
    });
  };

  return (
    <Button
      variant={isCompleted ? "outline" : "default"}
      onClick={handleToggle}
      disabled={isPending}
      className={
        isCompleted 
          ? "border-green-500/30 text-green-500 hover:bg-green-500/10 hover:text-green-400" 
          : "bg-[#00A8E8] hover:bg-[#0077B6] text-foreground"
      }
    >
      {isCompleted ? (
        <>
          <CheckCircle className="mr-2 h-4 w-4" />
          Completed
        </>
      ) : (
        <>
          <Circle className="mr-2 h-4 w-4" />
          Mark as Complete
        </>
      )}
    </Button>
  );
}
