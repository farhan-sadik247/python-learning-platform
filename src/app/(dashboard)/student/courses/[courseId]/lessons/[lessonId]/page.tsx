import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";
import { LessonProgressButton } from "./lesson-progress-button";

export default async function StudentLessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const user = await requireRole(["STUDENT"]);
  const { courseId, lessonId } = await params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      lessons: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!course) {
    notFound();
  }

  const currentIndex = course.lessons.findIndex(l => l.id === lessonId);
  if (currentIndex === -1) {
    notFound();
  }

  const lesson = course.lessons[currentIndex];
  const prevLesson = currentIndex > 0 ? course.lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < course.lessons.length - 1 ? course.lessons[currentIndex + 1] : null;

  const progress = await prisma.progress.findUnique({
    where: {
      userId_lessonId: {
        userId: user.id,
        lessonId: lesson.id,
      }
    }
  });

  const isCompleted = !!progress?.completed;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div>
        <Button render={<Link href={`/student/courses/${courseId}`} />} variant="ghost" className="mb-4 text-muted-foreground hover:text-foreground hover:bg-card -ml-4">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Button>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-sm text-muted-foreground font-medium mb-2 flex items-center gap-2">
              <Link href={`/student/courses/${courseId}`} className="hover:text-foreground transition-colors">Course</Link>
              <span>/</span>
              <span>{lesson.section || "General"}</span>
              <span>/</span>
              <span className="text-[#00A8E8]">{lesson.title}</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">{lesson.title}</h2>
          </div>
          <LessonProgressButton courseId={courseId} lessonId={lesson.id} isCompleted={isCompleted} />
        </div>
        {lesson.description && (
          <p className="text-lg text-muted-foreground mt-4">{lesson.description}</p>
        )}
      </div>

      <div className="bg-card rounded-lg overflow-hidden border border-border">
        <div className="border-b border-border bg-card flex items-center justify-between px-2 overflow-x-auto">
          <div className="flex items-center">
            {prevLesson ? (
              <Link href={`/student/courses/${courseId}/lessons/${prevLesson.id}`} className="flex items-center text-sm text-muted-foreground hover:text-foreground px-4 py-3 border-r border-border">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Link>
            ) : (
              <div className="px-4 py-3 border-r border-border text-sm text-muted-foreground flex items-center cursor-not-allowed">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </div>
            )}
            
            <div className="px-6 py-3 border-b-2 border-[#00A8E8] text-[#00A8E8]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            </div>
            
            <Link href={`/student/courses/${courseId}`} className="px-6 py-3 text-muted-foreground hover:text-muted-foreground">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </Link>
          </div>
          
          <div>
            {nextLesson ? (
              <Link href={`/student/courses/${courseId}/lessons/${nextLesson.id}`} className="flex items-center text-sm text-muted-foreground hover:text-foreground px-4 py-3 border-l border-border">
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            ) : (
              <div className="px-4 py-3 border-l border-border text-sm text-muted-foreground flex items-center cursor-not-allowed">
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </div>
            )}
          </div>
        </div>

        <div className="p-6 md:p-8">
          <h3 className="text-xl font-bold text-foreground mb-2">Lecture Slide</h3>
          <p className="text-sm text-muted-foreground mb-6 flex items-center gap-1">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
             Bookmark this page
          </p>
          
          {lesson.driveUrl && (
            <div className="w-full bg-muted flex flex-col items-center justify-center border border-border rounded-md mb-8">
               <iframe 
                 src={(() => {
                   const url = lesson.driveUrl;
                   if (url.includes('/preview')) return url;
                   const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
                   if (match && match[1]) {
                     return `https://drive.google.com/file/d/${match[1]}/preview`;
                   }
                   return url;
                 })()}
                 className="w-full min-h-150 border-0"
                 allow="autoplay"
               ></iframe>
            </div>
          )}
          
          {lesson.content && (
            <div className="bg-card border-t border-border pt-6 prose max-w-none text-foreground">
              <div 
                className="leading-relaxed"
                dangerouslySetInnerHTML={{ __html: lesson.content }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-border">
        {prevLesson ? (
          <Button render={<Link href={`/student/courses/${courseId}/lessons/${prevLesson.id}`} />} variant="outline" className="border-border text-muted-foreground hover:text-foreground hover:bg-card">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous Lesson
          </Button>
        ) : (
          <div />
        )}

        {nextLesson && (
          <Button render={<Link href={`/student/courses/${courseId}/lessons/${nextLesson.id}`} />} className="bg-[#00A8E8] hover:bg-[#0077B6] text-foreground">
            Next Lesson
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
