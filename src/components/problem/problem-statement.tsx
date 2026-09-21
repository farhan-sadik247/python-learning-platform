"use client";

import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

interface ProblemStatementProps {
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  description: string;
  isSolved?: boolean;
}

export function ProblemStatement({ title, difficulty, description, isSolved }: ProblemStatementProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {isSolved && (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 gap-1 pl-1.5">
              <Trophy className="w-3 h-3" /> Solved
            </Badge>
          )}
        </div>
        <Badge variant="outline" className={`${
            difficulty === 'EASY' ? 'text-green-500 border-green-500/20' :
            difficulty === 'MEDIUM' ? 'text-yellow-500 border-yellow-500/20' :
            'text-red-500 border-red-500/20'
        }`}>
          {difficulty}
        </Badge>
      </div>
      <div className="prose max-w-none text-foreground prose-invert">
        {description.split('\n').map((paragraph, idx) => (
          <p key={idx} className="whitespace-pre-wrap">{paragraph}</p>
        ))}
      </div>
    </div>
  );
}

