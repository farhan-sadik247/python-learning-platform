"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { ProblemTestCase } from "@/generated/prisma/client";

interface SampleTestCasesProps {
  testCases: ProblemTestCase[];
}

export function SampleTestCases({ testCases }: SampleTestCasesProps) {
  if (!testCases || testCases.length === 0) {
    return (
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">Examples</h3>
        <p className="text-muted-foreground italic">No sample test cases.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <h3 className="text-lg font-semibold text-foreground">Examples</h3>
      <div className="space-y-4">
        {testCases.map((tc, index) => (
          <Card key={tc.id} className="bg-background border-border">
            <CardContent className="p-4 space-y-3">
              <h4 className="font-medium text-foreground text-sm">Example {index + 1}</h4>
              <div className="grid gap-3">
                {tc.input && (
                  <div>
                    <span className="text-xs text-muted-foreground uppercase font-semibold">Input</span>
                    <pre className="mt-1 p-3 bg-muted rounded-md font-mono text-sm overflow-x-auto text-foreground whitespace-pre-wrap">{tc.input}</pre>
                  </div>
                )}
                <div>
                  <span className="text-xs text-muted-foreground uppercase font-semibold">Output</span>
                  <pre className="mt-1 p-3 bg-muted rounded-md font-mono text-sm overflow-x-auto text-foreground whitespace-pre-wrap">{tc.expectedOutput}</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

