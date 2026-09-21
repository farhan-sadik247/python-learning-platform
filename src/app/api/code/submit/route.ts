import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/code-runner/rate-limiter";
import { runPythonCode, normalizeOutput } from "@/lib/code-runner/python-runner";
import { z } from "zod";
import { SubmissionStatus } from "@/generated/prisma/client";

const submitSchema = z.object({
  problemId: z.string().min(1),
  code: z.string().min(1).max(65536) // max 64 KB of code
});

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication & Authorization
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (user.activeRole !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden. Only students can submit solutions." }, { status: 403 });
    }

    // 2. Rate Limiting (using 'submit' action)
    if (!checkRateLimit(user.id, 'submit')) {
      return NextResponse.json({ error: "Too many submissions. Please wait before trying again." }, { status: 429 });
    }

    // 3. Validation
    const body = await req.json();
    const parseResult = submitSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid request data", details: parseResult.error.format() }, { status: 400 });
    }

    const { problemId, code } = parseResult.data;

    // 4. Load Problem and ALL Test Cases
    const problem = await prisma.problem.findUnique({
      where: { 
        id: problemId,
        isPublished: true 
      },
      include: {
        testCases: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!problem) {
      return NextResponse.json({ error: "Problem not found or unpublished." }, { status: 404 });
    }

    if (problem.testCases.length === 0) {
      // Do NOT create a submission — the problem is misconfigured, not a student failure
      return NextResponse.json(
        { 
          error: "NO_TEST_CASES",
          message: "This problem has no test cases configured yet. It cannot be graded until the teacher adds test cases."
        },
        { status: 422 }
      );
    }

    // 5. Grading Execution Loop
    let passedTests = 0;
    const totalTests = problem.testCases.length;
    let finalStatus: SubmissionStatus = 'ACCEPTED';
    let totalExecutionTime = 0;

    for (let i = 0; i < totalTests; i++) {
      const tc = problem.testCases[i];
      
      const runOutput = await runPythonCode({
        code,
        input: tc.input || ""
      });

      totalExecutionTime += runOutput.executionTimeMs;

      let status: SubmissionStatus = 'WRONG_ANSWER';

      if (runOutput.error === 'TIMEOUT') {
        status = 'TIMEOUT';
      } else if (runOutput.error === 'OUTPUT_LIMIT_EXCEEDED') {
        status = 'OUTPUT_LIMIT_EXCEEDED';
      } else if (runOutput.exitCode !== 0 && runOutput.exitCode !== null) {
        status = 'RUNTIME_ERROR';
      } else {
        const normalizedActual = normalizeOutput(runOutput.stdout);
        const normalizedExpected = normalizeOutput(tc.expectedOutput);
        
        if (normalizedActual === normalizedExpected) {
          status = 'ACCEPTED';
          passedTests++;
        }
      }

      // First failure determines overall non-ACCEPTED status
      if (status !== 'ACCEPTED' && finalStatus === 'ACCEPTED') {
        finalStatus = status;
      }
    }

    // 6. Calculate Score
    const score = Math.floor((passedTests / totalTests) * 100);

    // 7. Persist Submission
    const submission = await prisma.submission.create({
      data: {
        userId: user.id,
        problemId: problem.id,
        code,
        status: finalStatus,
        score,
        passedTests,
        totalTests,
        executionTimeMs: totalExecutionTime
      }
    });

    // 8. Return Sanitized Result (NO HIDDEN DATA)
    return NextResponse.json({
      submissionId: submission.id,
      status: submission.status,
      score: submission.score,
      passedTests: submission.passedTests,
      totalTests: submission.totalTests,
      executionTimeMs: submission.executionTimeMs
    });

  } catch (error: unknown) {
    console.error("Submission API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
