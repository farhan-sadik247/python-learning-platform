import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { getStatusConfig } from "./submission-list";
import type { SubmissionStatus } from "@/generated/prisma/client";

interface SubmissionDetailProps {
  submission: {
    id: string;
    problem: { title: string };
    user?: { name: string; email: string };
    status: SubmissionStatus;
    score: number;
    passedTests: number;
    totalTests: number;
    executionTimeMs: number;
    createdAt: Date;
    code: string;
  };
}

export function SubmissionDetail({ submission }: SubmissionDetailProps) {
  const config = getStatusConfig(submission.status);
  const Icon = config.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{submission.problem.title}</h2>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            {submission.user && <div>Submitted by: {submission.user.name} ({submission.user.email})</div>}
            <div>{format(new Date(submission.createdAt), "PPP 'at' p")}</div>
          </div>
        </div>
        <Badge variant="secondary" className={`${config.color} text-base px-3 py-1 border-0 gap-2`}>
          <Icon className="w-5 h-5" />
          {config.label}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col items-center justify-center">
          <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Score</div>
          <div className="text-3xl font-bold font-mono">{submission.score}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col items-center justify-center">
          <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Tests Passed</div>
          <div className="text-3xl font-bold font-mono">{submission.passedTests} / {submission.totalTests}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col items-center justify-center">
          <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Exec Time</div>
          <div className="text-3xl font-bold font-mono">{submission.executionTimeMs}ms</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col items-center justify-center">
          <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Status</div>
          <div className="text-xl font-bold text-center">{config.label}</div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-medium">Submitted Code</h3>
        <div className="border border-border rounded-md overflow-hidden bg-[#1E1E1E] p-4 text-sm font-mono text-gray-300 overflow-x-auto">
          <pre>{submission.code}</pre>
        </div>
      </div>
    </div>
  );
}

