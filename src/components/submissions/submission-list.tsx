import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, XCircle, Clock, AlertTriangle, AlertCircle } from "lucide-react";
import type { SubmissionStatus } from "@/generated/prisma/client";

interface SubmissionListItem {
  id: string;
  problem: { id: string; title: string };
  user?: { name: string; email: string };
  status: SubmissionStatus;
  score: number;
  passedTests: number;
  totalTests: number;
  createdAt: Date;
}

interface SubmissionListProps {
  submissions: SubmissionListItem[];
  basePath: string; // e.g. "/student/submissions", "/teacher/submissions", "/admin/submissions"
  showUser?: boolean;
}

export function getStatusConfig(status: SubmissionStatus) {
  switch (status) {
    case "ACCEPTED":
      return { label: "Accepted", color: "bg-green-500/10 text-green-500 hover:bg-green-500/20", icon: CheckCircle };
    case "WRONG_ANSWER":
      return { label: "Wrong Answer", color: "bg-red-500/10 text-red-500 hover:bg-red-500/20", icon: XCircle };
    case "TIMEOUT":
      return { label: "Time Limit", color: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20", icon: Clock };
    case "RUNTIME_ERROR":
      return { label: "Runtime Error", color: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20", icon: AlertTriangle };
    case "OUTPUT_LIMIT_EXCEEDED":
      return { label: "Output Limit", color: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20", icon: AlertCircle };
    case "INTERNAL_ERROR":
      return { label: "Internal Error", color: "bg-destructive/10 text-destructive hover:bg-destructive/20", icon: AlertCircle };
    default:
      return { label: status, color: "bg-muted text-muted-foreground", icon: AlertCircle };
  }
}

export function SubmissionList({ submissions, basePath, showUser = false }: SubmissionListProps) {
  if (submissions.length === 0) {
    return (
      <div className="text-center p-8 border border-border rounded-lg bg-card">
        <p className="text-muted-foreground">No submissions found.</p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Problem</TableHead>
            {showUser && <TableHead>Student</TableHead>}
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Score</TableHead>
            <TableHead className="text-right">Passed</TableHead>
            <TableHead className="text-right">Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((sub) => {
            const config = getStatusConfig(sub.status);
            const Icon = config.icon;
            return (
              <TableRow key={sub.id}>
                <TableCell className="font-medium">
                  <Link href={`${basePath}/${sub.id}`} className="hover:underline text-[#00A8E8]">
                    {sub.problem.title}
                  </Link>
                </TableCell>
                {showUser && (
                  <TableCell>
                    <div className="text-sm">
                      <div>{sub.user?.name}</div>
                      <div className="text-xs text-muted-foreground">{sub.user?.email}</div>
                    </div>
                  </TableCell>
                )}
                <TableCell>
                  <Badge variant="secondary" className={`${config.color} border-0 gap-1`}>
                    <Icon className="w-3 h-3" />
                    {config.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">{sub.score}</TableCell>
                <TableCell className="text-right text-muted-foreground text-sm">
                  {sub.passedTests} / {sub.totalTests}
                </TableCell>
                <TableCell className="text-right text-muted-foreground text-sm">
                  {formatDistanceToNow(new Date(sub.createdAt), { addSuffix: true })}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

