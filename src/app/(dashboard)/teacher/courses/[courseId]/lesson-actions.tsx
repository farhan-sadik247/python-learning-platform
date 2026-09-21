"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Pencil, Trash2 } from "lucide-react";
import { deleteLessonAction, reorderLessonAction } from "@/app/actions/lessons";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface LessonActionsProps {
  courseId: string;
  lessonId: string;
  isFirst: boolean;
  isLast: boolean;
}

export function LessonActions({ courseId, lessonId, isFirst, isLast }: LessonActionsProps) {
  const [isPending, startTransition] = useTransition();

  const handleReorder = (direction: "up" | "down") => {
    startTransition(async () => {
      await reorderLessonAction(courseId, lessonId, direction);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteLessonAction(courseId, lessonId);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col mr-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted"
          disabled={isFirst || isPending}
          onClick={() => handleReorder("up")}
        >
          <ArrowUp className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted"
          disabled={isLast || isPending}
          onClick={() => handleReorder("down")}
        >
          <ArrowDown className="h-3 w-3" />
        </Button>
      </div>

      <Button render={<Link href={`/teacher/courses/${courseId}/lessons/${lessonId}/edit`} />} variant="outline" size="sm" className="border-border text-muted-foreground hover:text-foreground hover:bg-card">
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </Button>

      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="outline" size="sm" className="border-destructive text-destructive hover:text-destructive-foreground hover:bg-destructive/10" disabled={isPending} />}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-card border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. This will permanently delete the lesson
              and remove all associated student progress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted text-foreground hover:bg-accent/80 hover:text-accent-foreground border-none">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
