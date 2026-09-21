import { prisma } from "@/lib/prisma";

export interface CourseProgressResult {
  totalLessons: number;
  completedLessons: number;
  totalPublishedProblems: number;
  solvedProblems: number;
  lessonPercentage: number;
  problemPercentage: number;
  overallPercentage: number;
  completedLessonIds: string[];
  solvedProblemIds: string[];
}

export async function getStudentCourseProgress(userId: string, courseId: string): Promise<CourseProgressResult> {
  // 1. Get Course details — only lesson-attached published problems count toward progress
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      lessons: { select: { id: true } },
    },
  });

  if (!course) {
    return {
      totalLessons: 0, completedLessons: 0,
      totalPublishedProblems: 0, solvedProblems: 0,
      lessonPercentage: 0, problemPercentage: 0, overallPercentage: 0,
      completedLessonIds: [], solvedProblemIds: []
    };
  }

  const lessonIds = course.lessons.map(l => l.id);
  const totalLessons = lessonIds.length;

  // Count only lesson-attached published problems (lessonId NOT null)
  // This excludes standalone problems (courseId-only, lessonId=null) from progress
  const lessonProblems = await prisma.problem.findMany({
    where: {
      lessonId: { in: lessonIds },
      isPublished: true,
    },
    select: { id: true },
  });
  const problemIds = lessonProblems.map(p => p.id);
  const totalPublishedProblems = problemIds.length;

  // 2. Get completed lessons for this course
  const completedLessonsData = await prisma.progress.findMany({
    where: {
      userId,
      lessonId: { in: lessonIds },
      completed: true
    },
    select: { lessonId: true }
  });
  const completedLessonIds = completedLessonsData.map(p => p.lessonId);
  const completedLessons = completedLessonIds.length;

  // 3. Get solved problems for this course
  // A problem is solved only when there's at least one ACCEPTED submission
  const solvedProblemsData = await prisma.submission.groupBy({
    by: ['problemId'],
    where: {
      userId,
      problemId: { in: problemIds },
      status: 'ACCEPTED'
    }
  });
  const solvedProblemIds = solvedProblemsData.map(s => s.problemId);
  const solvedProblems = solvedProblemIds.length;

  // 4. Calculate percentages
  const lessonPercentage = totalLessons === 0 ? 0 : Math.floor((completedLessons / totalLessons) * 100);
  const problemPercentage = totalPublishedProblems === 0 ? 0 : Math.floor((solvedProblems / totalPublishedProblems) * 100);
  
  let overallPercentage = 0;
  const totalItems = totalLessons + totalPublishedProblems;
  if (totalItems > 0) {
    overallPercentage = Math.floor(((completedLessons + solvedProblems) / totalItems) * 100);
  }

  return {
    totalLessons,
    completedLessons,
    totalPublishedProblems,
    solvedProblems,
    lessonPercentage,
    problemPercentage,
    overallPercentage,
    completedLessonIds,
    solvedProblemIds
  };
}

export interface OverallProgressResult {
  totalLessons: number;
  completedLessons: number;
  totalPublishedProblems: number;
  solvedProblems: number;
  overallPercentage: number;
}

export async function getStudentOverallProgress(userId: string): Promise<OverallProgressResult> {
  const [
    totalLessons,
    totalPublishedProblems,
    completedLessons,
    solvedProblemsData
  ] = await Promise.all([
    prisma.lesson.count(),
    // Only count lesson-attached published problems globally
    prisma.problem.count({ where: { isPublished: true, lessonId: { not: null } } }),
    prisma.progress.count({ where: { userId, completed: true } }),
    prisma.submission.groupBy({
      by: ['problemId'],
      where: {
        userId,
        status: 'ACCEPTED',
        // Only count submissions for lesson-attached problems
        problem: { lessonId: { not: null }, isPublished: true }
      }
    })
  ]);

  const solvedProblems = solvedProblemsData.length;
  
  let overallPercentage = 0;
  const totalItems = totalLessons + totalPublishedProblems;
  if (totalItems > 0) {
    overallPercentage = Math.floor(((completedLessons + solvedProblems) / totalItems) * 100);
  }

  return {
    totalLessons,
    completedLessons,
    totalPublishedProblems,
    solvedProblems,
    overallPercentage
  };
}

export async function getStudentProblemProgress(userId: string, problemId: string): Promise<boolean> {
  const acceptedSubmission = await prisma.submission.findFirst({
    where: {
      userId,
      problemId,
      status: 'ACCEPTED'
    },
    select: { id: true }
  });

  return !!acceptedSubmission;
}
