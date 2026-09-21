export type ExecutionStatus = 'PASSED' | 'FAILED' | 'RUNTIME_ERROR' | 'TIMEOUT' | 'OUTPUT_LIMIT_EXCEEDED' | 'NO_TEST_CASES';

export interface TestCaseResult {
  testCaseNumber: number;
  passed: boolean;
  status: ExecutionStatus;
  actualOutput?: string;
  expectedOutput: string;
  error?: string;
  executionTimeMs: number;
}

export interface ExecutionResult {
  success: boolean;
  noTestCases?: boolean;   // true when no visible tests exist — not a code failure
  message?: string;        // informational message for noTestCases state
  testCases: TestCaseResult[];
  summary: {
    passed: number;
    total: number;
  };
}
