import { requireRole, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata = {
  title: "Student Progress | Teacher Dashboard",
};

export default async function TeacherStudentsPage() {
  await requireRole(["TEACHER"]);
  const user = await getCurrentUser();
  if (!user) return null;

  const courses = await prisma.course.findMany({
    where: { teacherId: user.id },
    select: { id: true, title: true }
  });
  
  const courseIds = courses.map(c => c.id);

  if (courseIds.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Progress</h1>
          <p className="text-muted-foreground mt-2">Monitor your students&apos; learning progress.</p>
        </div>
        <Card className="bg-background border-border">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">You don&apos;t have any courses yet, so there are no students to display.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Find students who have activity in these courses (progress or submissions)
  // Since we don't have strict "enrollments", we infer them from Progress on lessons belonging to the course
  // or Submissions on problems belonging to the course.
  
  const courseLessons = await prisma.lesson.findMany({
    where: { courseId: { in: courseIds } },
    select: { id: true, courseId: true }
  });
  const lessonIds = courseLessons.map(l => l.id);

  const courseProblems = await prisma.problem.findMany({
    where: {
      OR: [
        { courseId: { in: courseIds } },
        { lessonId: { in: lessonIds } }
      ]
    },
    select: { id: true, courseId: true, lessonId: true }
  });
  const problemIds = courseProblems.map(p => p.id);

  // Get users who have Progress or Submissions
  const [progresses, submissions] = await Promise.all([
    prisma.progress.findMany({
      where: { lessonId: { in: lessonIds } },
      include: { user: { select: { id: true, name: true, email: true } } }
    }),
    prisma.submission.findMany({
      where: { problemId: { in: problemIds } },
      include: { user: { select: { id: true, name: true, email: true } } }
    })
  ]);

  // Aggregate student stats map
  const studentMap = new Map<string, {
    id: string;
    name: string;
    email: string;
    completedLessons: Set<string>;
    solvedProblems: Set<string>;
    lastActivityAt: Date | null;
  }>();

  for (const p of progresses) {
    if (!studentMap.has(p.user.id)) {
      studentMap.set(p.user.id, { id: p.user.id, name: p.user.name, email: p.user.email, completedLessons: new Set(), solvedProblems: new Set(), lastActivityAt: null });
    }
    const student = studentMap.get(p.user.id)!;
    if (p.completed) student.completedLessons.add(p.lessonId);
    
    if (!student.lastActivityAt || p.updatedAt > student.lastActivityAt) {
      student.lastActivityAt = p.updatedAt;
    }
  }

  for (const s of submissions) {
    if (!studentMap.has(s.user.id)) {
      studentMap.set(s.user.id, { id: s.user.id, name: s.user.name, email: s.user.email, completedLessons: new Set(), solvedProblems: new Set(), lastActivityAt: null });
    }
    const student = studentMap.get(s.user.id)!;
    if (s.status === 'ACCEPTED') student.solvedProblems.add(s.problemId);
    
    if (!student.lastActivityAt || s.createdAt > student.lastActivityAt) {
      student.lastActivityAt = s.createdAt;
    }
  }

  const students = Array.from(studentMap.values()).sort((a, b) => {
    return (b.lastActivityAt?.getTime() || 0) - (a.lastActivityAt?.getTime() || 0);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Progress</h1>
        <p className="text-muted-foreground mt-2">
          Monitor your students&apos; activity across your courses.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Students ({students.length})</CardTitle>
          <CardDescription>Based on lesson and coding activity</CardDescription>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No students have interacted with your courses yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-center">Lessons Completed</TableHead>
                  <TableHead className="text-center">Problems Solved</TableHead>
                  <TableHead className="text-right">Last Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-muted-foreground">{student.email}</div>
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {student.completedLessons.size}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {student.solvedProblems.size}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {student.lastActivityAt ? formatDistanceToNow(student.lastActivityAt, { addSuffix: true }) : 'Never'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
