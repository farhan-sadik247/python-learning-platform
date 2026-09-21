"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProblemNavigationProps {
  courseId: string;
  lessonId: string;
  courseTitle: string;
  lessonTitle: string;
  problemTitle: string;
  prevProblemId?: string | null;
  nextProblemId?: string | null;
}

export function ProblemNavigation({
  courseId,
  lessonId,
  courseTitle,
  lessonTitle,
  problemTitle,
  prevProblemId,
  nextProblemId
}: ProblemNavigationProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium flex-wrap">
        <Link href={`/student/courses/${courseId}`} className="hover:text-foreground transition-colors truncate max-w-30">
          {courseTitle}
        </Link>
        <span>/</span>
        <Link href={`/student/courses/${courseId}/lessons/${lessonId}`} className="hover:text-foreground transition-colors truncate max-w-37.5">
          {lessonTitle}
        </Link>
        <span>/</span>
        <span className="text-[#00A8E8] truncate max-w-50">{problemTitle}</span>
      </div>

      {(prevProblemId || nextProblemId) && (
        <div className="flex items-center gap-2">
          {prevProblemId ? (
            <Button render={<Link href={`/student/problems/${prevProblemId}`} />} variant="outline" size="sm" className="border-border text-muted-foreground hover:text-foreground hover:bg-card">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled className="border-border text-muted-foreground/30 opacity-50">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
          )}
          
          {nextProblemId ? (
            <Button render={<Link href={`/student/problems/${nextProblemId}`} />} variant="outline" size="sm" className="border-border text-muted-foreground hover:text-foreground hover:bg-card">
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled className="border-border text-muted-foreground/30 opacity-50">
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

