"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteCourseAction } from "@/app/actions/courses";
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

interface CourseActionsProps {
  courseId: string;
}

export function CourseActions({ courseId }: CourseActionsProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteCourseAction(courseId);
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="outline" className="border-destructive text-destructive hover:text-destructive-foreground hover:bg-destructive/10" disabled={isPending} />}>
        <Trash2 className="h-4 w-4 mr-2" />
        Delete Course
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-card border-border text-foreground">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            This action cannot be undone. This will permanently delete the course,
            all of its lessons, and all student progress associated with it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-muted text-foreground hover:bg-accent/80 hover:text-accent-foreground border-none">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-foreground">
            Delete Course
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
