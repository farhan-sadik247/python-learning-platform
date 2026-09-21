import { requireRole, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { SubmissionDetail } from "@/components/submissions/submission-detail";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{
    submissionId: string;
  }>;
}

export default async function TeacherSubmissionDetailPage({ params }: Props) {
  await requireRole(["TEACHER"]);
  const user = await getCurrentUser();
  if (!user) return null;

  const { submissionId } = await params;

  const submission = await prisma.submission.findUnique({
    where: { 
      id: submissionId,
      problem: {
        createdById: user.id // Security: ensure teacher owns the problem
      }
    },
    include: {
      problem: { select: { title: true } },
      user: { select: { name: true, email: true } }
    }
  });

  if (!submission) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Link href="/teacher/submissions">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-medium">Back to Submissions</h1>
      </div>

      <SubmissionDetail submission={submission} />
    </div>
  );
}
