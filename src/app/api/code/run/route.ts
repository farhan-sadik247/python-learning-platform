import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/code-runner/rate-limiter";
import { runPythonCode, normalizeOutput } from "@/lib/code-runner/python-runner";
import { ExecutionResult, TestCaseResult, ExecutionStatus } from "@/lib/code-runner/types";
import { z } from "zod";

const runSchema = z.object({
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
      return NextResponse.json({ error: "Forbidden. Only students can run code." }, { status: 403 });
    }

    // 2. Rate Limiting
    if (!checkRateLimit(user.id)) {
      return NextResponse.json({ error: "Too many execution requests. Please try again later." }, { status: 429 });
    }

    // 3. Validation
    const body = await req.json();
    const parseResult = runSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid request data", details: parseResult.error.format() }, { status: 400 });
    }

    const { problemId, code } = parseResult.data;

    // 4. Load Problem and VISIBLE Test Cases
    const problem = await prisma.problem.findUnique({
      where: { 
        id: problemId,
        isPublished: true 
      },
      include: {
        testCases: {
          where: { isHidden: false }, // Security: explicitly only fetch visible tests
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!problem) {
      return NextResponse.json({ error: "Problem not found or unpublished." }, { status: 404 });
    }

    // Early exit: no visible test cases configured
    if (problem.testCases.length === 0) {
      const noTestResult: ExecutionResult = {
        success: false,
        noTestCases: true,
        message: "No visible test cases have been configured for this problem yet.",
        testCases: [],
        summary: { passed: 0, total: 0 }
      };
      return NextResponse.json(noTestResult);
    }

    // 5. Execution Loop
    const results: TestCaseResult[] = [];
    let passedCount = 0;

    for (let i = 0; i < problem.testCases.length; i++) {
      const tc = problem.testCases[i];
      
      const runOutput = await runPythonCode({
        code,
        input: tc.input || ""
      });

      let status: ExecutionStatus = 'FAILED';
      let passed = false;
      const actualOutput = runOutput.stdout;
      let error = runOutput.stderr;

      if (runOutput.error === 'TIMEOUT') {
        status = 'TIMEOUT';
        error = 'Execution timed out.';
      } else if (runOutput.error === 'OUTPUT_LIMIT_EXCEEDED') {
        status = 'OUTPUT_LIMIT_EXCEEDED';
        error = 'Output exceeded the allowed limit.';
      } else if (runOutput.exitCode !== 0 && runOutput.exitCode !== null) {
        status = 'RUNTIME_ERROR';
      } else {
        // Compare output
        const normalizedActual = normalizeOutput(actualOutput);
        const normalizedExpected = normalizeOutput(tc.expectedOutput);
        
        if (normalizedActual === normalizedExpected) {
          status = 'PASSED';
          passed = true;
          passedCount++;
        }
      }

      results.push({
        testCaseNumber: i + 1,
        passed,
        status,
        actualOutput,
        expectedOutput: tc.expectedOutput,
        error: error || undefined,
        executionTimeMs: runOutput.executionTimeMs
      });
    }

    // 6. Return Structured Result
    const executionResult: ExecutionResult = {
      success: passedCount === problem.testCases.length && problem.testCases.length > 0,
      testCases: results,
      summary: {
        passed: passedCount,
        total: problem.testCases.length
      }
    };

    return NextResponse.json(executionResult);

  } catch (error: unknown) {
    console.error("Execution API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
