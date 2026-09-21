import { requireRole, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ProblemStatement } from "@/components/problem/problem-statement";
import { SampleTestCases } from "@/components/problem/sample-testcases";
import { HintCard } from "@/components/problem/hint-card";
import { MonacoEditorWrapper } from "@/components/problem/monaco-editor-wrapper";
import { ProblemNavigation } from "@/components/problem/problem-navigation";
import { getStudentProblemProgress } from "@/lib/progress";

export default async function StudentProblemPage({
  params
}: {
  params: Promise<{ problemId: string }>
}) {
  await requireRole(["STUDENT"]);
  const user = await getCurrentUser();
  if (!user) return null;
  const { problemId } = await params;

  const problem = await prisma.problem.findUnique({
    where: { 
      id: problemId,
      isPublished: true 
    },
    include: {
      lesson: {
        include: {
          course: true
        }
      },
      testCases: {
        where: {
          isHidden: false
        },
        orderBy: {
          order: 'asc'
        }
      }
    }
  });

  if (!problem || !problem.lesson) {
    notFound();
  }

  // Find all published problems for this lesson to determine Prev/Next navigation
  const lessonProblems = await prisma.problem.findMany({
    where: {
      lessonId: problem.lessonId,
      isPublished: true
    },
    orderBy: {
      order: 'asc'
    },
    select: {
      id: true,
      title: true
    }
  });

  const currentIndex = lessonProblems.findIndex(p => p.id === problem.id);
  const prevProblem = currentIndex > 0 ? lessonProblems[currentIndex - 1] : undefined;
  const nextProblem = currentIndex < lessonProblems.length - 1 ? lessonProblems[currentIndex + 1] : undefined;

  const prevProblemId = prevProblem ? prevProblem.id : null;
  const nextProblemId = nextProblem ? nextProblem.id : null;

  const isSolved = await getStudentProblemProgress(user.id, problem.id);

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-h-screen">
      <ProblemNavigation 
        courseId={problem.lesson.courseId}
        lessonId={problem.lessonId!}
        courseTitle={problem.lesson.course.title}
        lessonTitle={problem.lesson.title}
        problemTitle={problem.title}
        prevProblemId={prevProblemId}
        nextProblemId={nextProblemId}
      />
      
      {/* Desktop: Split pane, Mobile: Stack */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Left side: Problem Description */}
        <div className="w-full lg:w-1/2 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-8">
              <ProblemStatement 
                title={problem.title} 
                difficulty={problem.difficulty} 
                description={problem.description} 
                isSolved={isSolved}
              />
              <SampleTestCases testCases={problem.testCases} />
              <HintCard hints={problem.hints} />
            </div>
          </div>
        </div>

        {/* Right side: Editor */}
        <div className="w-full lg:w-1/2 flex flex-col h-[600px] lg:h-auto pb-6">
          <MonacoEditorWrapper 
            problemId={problem.id} 
            starterCode={problem.starterCode} 
          />
        </div>

      </div>
    </div>
  );
}

