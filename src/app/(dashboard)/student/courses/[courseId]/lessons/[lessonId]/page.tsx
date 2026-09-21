import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Code, Trophy } from "lucide-react";
import { LessonProgressButton } from "./lesson-progress-button";
import { Badge } from "@/components/ui/badge";

export default async function StudentLessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const user = await requireRole(["STUDENT"]);
  const { courseId, lessonId } = await params;

  // Verify the course and lesson exist
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      lessons: {
        orderBy: { order: "asc" },
        include: {
          problems: {
            where: { isPublished: true },
            orderBy: { order: "asc" },
          }
        }
      },
    },
  });

  if (!course) {
    notFound();
  }

  const lessonIndex = course.lessons.findIndex((l) => l.id === lessonId);
  if (lessonIndex === -1) {
    notFound();
  }

  const lesson = course.lessons[lessonIndex];
  const prevLesson = lessonIndex > 0 ? course.lessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < course.lessons.length - 1 ? course.lessons[lessonIndex + 1] : null;

  // Check if current lesson is completed
  const progress = await prisma.progress.findUnique({
    where: {
      userId_lessonId: {
        userId: user.id,
        lessonId: lesson.id,
      }
    }
  });

  const isCompleted = !!progress?.completed;

  // Fetch solved problems for this lesson
  const problemIds = lesson.problems.map(p => p.id);
  const solvedSubmissions = await prisma.submission.findMany({
    where: {
      userId: user.id,
      problemId: { in: problemIds },
      status: 'ACCEPTED'
    },
    select: { problemId: true }
  });
  const solvedProblemIds = new Set(solvedSubmissions.map(s => s.problemId));

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

      <div className="bg-card rounded-lg overflow-hidden border border-border p-6 md:p-8">
        <h3 className="text-xl font-bold text-foreground mb-4">Practice Problems</h3>
        {lesson.problems && lesson.problems.length > 0 ? (
          <div className="space-y-3">
            {lesson.problems.map((problem) => {
              const isSolved = solvedProblemIds.has(problem.id);
              
              return (
                <Link key={problem.id} href={`/student/problems/${problem.id}`}>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-background hover:border-slate-700 transition-colors group cursor-pointer mb-3">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-md ${isSolved ? 'bg-yellow-500/10' : 'bg-primary/10'}`}>
                        {isSolved ? (
                          <Trophy className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <Code className="h-5 w-5 text-[#00A8E8]" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-foreground group-hover:text-[#00A8E8] transition-colors">{problem.title}</h4>
                          {isSolved && (
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-[10px] h-5 py-0">Solved</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1 max-w-75 sm:max-w-md lg:max-w-lg mt-1">{problem.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <Badge variant="outline" className={`${
                          problem.difficulty === 'EASY' ? 'text-green-500 border-green-500/20' :
                          problem.difficulty === 'MEDIUM' ? 'text-yellow-500 border-yellow-500/20' :
                          'text-red-500 border-red-500/20'
                      }`}>
                        {problem.difficulty}
                      </Badge>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors hidden sm:block" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center p-8 border border-border border-dashed rounded-lg text-muted-foreground">
            No practice problems available yet.
          </div>
        )}
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
