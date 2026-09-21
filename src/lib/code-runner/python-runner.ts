import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const PYTHON_EXECUTABLE = process.env.PYTHON_EXECUTABLE || (os.platform() === 'win32' ? 'python' : 'python3');
const TIMEOUT_MS = parseInt(process.env.PYTHON_EXECUTION_TIMEOUT_MS || '2000', 10);
const MAX_OUTPUT_BYTES = parseInt(process.env.PYTHON_MAX_OUTPUT_BYTES || '65536', 10); // 64 KB

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
  
  // Create a temporary, isolated workspace directory per execution
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'py-runner-'));
  const tempFile = path.join(tempDir, 'main.py');
  
  const result: RunOutput = { stdout: '', stderr: '', exitCode: null, executionTimeMs: 0 };
  const startTime = Date.now();

  try {
    // Write student code to file
    await fs.writeFile(tempFile, code, 'utf-8');

    // Spawn isolated process without application secrets
    const child = spawn(/*turbopackIgnore: true*/ PYTHON_EXECUTABLE, [tempFile], {
      env: { PATH: process.env.PATH } as unknown as NodeJS.ProcessEnv, // Minimal environment, PATH needed to find python
      cwd: tempDir,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdoutData = Buffer.alloc(0);
    let stderrData = Buffer.alloc(0);
    let isLimitExceeded = false;

    child.stdout.on('data', (chunk: Buffer) => {
      if (isLimitExceeded) return;
      stdoutData = Buffer.concat([stdoutData, chunk]);
      if (stdoutData.length > MAX_OUTPUT_BYTES) {
        isLimitExceeded = true;
        child.kill('SIGKILL');
      }
    });

    child.stderr.on('data', (chunk: Buffer) => {
      if (isLimitExceeded) return;
      stderrData = Buffer.concat([stderrData, chunk]);
      if (stderrData.length > MAX_OUTPUT_BYTES) {
        isLimitExceeded = true;
        child.kill('SIGKILL');
      }
    });

    // Pass test input via stdin
    if (input) {
      child.stdin.write(input);
    }
    child.stdin.end();

    // Wait for execution to finish, enforcing a strict timeout
    await new Promise<void>((resolve) => {
      const timeoutId = setTimeout(() => {
        result.error = 'TIMEOUT';
        child.kill('SIGKILL');
        resolve();
      }, TIMEOUT_MS);

      child.on('close', (code: number | null) => {
        clearTimeout(timeoutId);
        result.exitCode = code;
        resolve();
      });
      
      child.on('error', (err: Error) => {
        clearTimeout(timeoutId);
        stderrData = Buffer.concat([stderrData, Buffer.from(`Execution Engine Error: Failed to start process. ${err.message}`)]);
        resolve();
      });
    });

    if (isLimitExceeded) {
      result.error = 'OUTPUT_LIMIT_EXCEEDED';
    }

    result.stdout = stdoutData.toString('utf-8');
    result.stderr = stderrData.toString('utf-8');
    
  } finally {
    result.executionTimeMs = Date.now() - startTime;
    // Guaranteed cleanup
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (e) {
      console.error('Failed to cleanup execution temp dir:', e);
    }
  }

  // Sanitize paths from output to prevent exposing the internal filesystem structure
  if (result.stderr) {
    const escapeRegex = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const sanitizedFile = escapeRegex(tempFile);
    result.stderr = result.stderr.replace(new RegExp(sanitizedFile, 'g'), 'main.py');
    const sanitizedDir = escapeRegex(tempDir);
    result.stderr = result.stderr.replace(new RegExp(sanitizedDir, 'g'), '/workspace');
  }

  return result;
}

export function normalizeOutput(output: string): string {
  // Trim leading/trailing whitespace, normalize CRLF to LF
  return output.trim().replace(/\r\n/g, '\n');
}
