
export interface RunOptions {
  code: string;
  input: string;
}

export interface RunOutput {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  error?: 'TIMEOUT' | 'OUTPUT_LIMIT_EXCEEDED';
  executionTimeMs: number;
}

export async function runPythonCode(options: RunOptions): Promise<RunOutput> {
  const { code, input } = options;
  const startTime = Date.now();
  const result: RunOutput = { stdout: '', stderr: '', exitCode: null, executionTimeMs: 0 };

  try {
    // We use the Wandbox API (https://wandbox.org) to run Python code.
    // Why? 
    // 1. Vercel does not have Python installed in its Node.js environment (causing the spawn ENOENT error).
    // 2. Security! Running student code directly on your local machine using `spawn` is extremely dangerous.
    //    Wandbox securely sandboxes the code inside an isolated container.
    const response = await fetch('https://wandbox.org/api/compile.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        compiler: 'cpython-3.14.0',
        code: code,
        stdin: input || "",
      }),
    });

    if (!response.ok) {
      result.stderr = `Execution Engine Error: API returned ${response.status}`;
      return result;
    }

    const data = await response.json();

    result.stdout = data.program_output || '';
    result.stderr = data.program_error || '';
    result.exitCode = parseInt(data.status, 10);

    if (data.signal === 'Kill' || data.signal === 'SIGKILL' || data.signal === 'SIGTERM') {
      result.error = 'TIMEOUT';
    }
    
    // Safety check for huge outputs
    if (result.stdout.length > 65536) {
       result.stdout = result.stdout.substring(0, 65536);
       result.error = 'OUTPUT_LIMIT_EXCEEDED';
    }
  } catch (error: unknown) {
    result.stderr = `Execution Engine Error: Failed to contact execution server. ${(error as Error).message}`;
  } finally {
    result.executionTimeMs = Date.now() - startTime;
  }

  return result;
}

export function normalizeOutput(output: string): string {
  // Trim leading/trailing whitespace, normalize CRLF to LF
  return output.trim().replace(/\r\n/g, '\n');
}
