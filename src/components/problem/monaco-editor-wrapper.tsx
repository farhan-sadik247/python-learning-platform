"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import {
  Play, Send, Loader2, AlertCircle, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Clock, Trophy
} from "lucide-react";
import type { ExecutionResult } from "@/lib/code-runner/types";

// Lazy load Monaco editor to avoid SSR issues
const Editor = dynamic(() => import("@monaco-editor/react").then(mod => mod.Editor), { 
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#1e1e1e]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
});

interface MonacoEditorWrapperProps {
  problemId: string;
  starterCode?: string | null;
}

export function MonacoEditorWrapper({ problemId, starterCode }: MonacoEditorWrapperProps) {
  const [code, setCode] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);
  
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<{status: string, score: number, passedTests: number, totalTests: number, executionTimeMs: number} | null>(null);

  // Which test case is expanded
  const [expandedTc, setExpandedTc] = useState<number | null>(0);
  // Output panel open/collapsed
  const [outputOpen, setOutputOpen] = useState(false);

  // Initialize and persist code
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
    const storageKey = `problem_${problemId}_code`;
    const savedCode = localStorage.getItem(storageKey);
    
    if (savedCode !== null) {
      setCode(savedCode);
    } else {
      setCode(starterCode || "def solve():\n    # Write your code here\n    pass\n");
    }
  }, [problemId, starterCode]);

  const handleEditorChange = (value: string | undefined) => {
    const newCode = value || "";
    setCode(newCode);
    localStorage.setItem(`problem_${problemId}_code`, newCode);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setExecutionResult(null);
    setGeneralError(null);
    setSubmitResult(null);
    setExpandedTc(0);
    setOutputOpen(true);
    
    try {
      const res = await fetch('/api/code/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId, code })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setGeneralError(data.error || "An error occurred during execution.");
      } else {
        setExecutionResult(data);
      }
    } catch {
      setGeneralError("Failed to connect to the execution engine.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    setIsRunning(true);
    setExecutionResult(null);
    setGeneralError(null);
    setSubmitResult(null);
    setOutputOpen(true);
    
    try {
      const res = await fetch('/api/code/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId, code })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 422 && data.error === 'NO_TEST_CASES') {
          setGeneralError(data.message || "This problem has no test cases configured yet.");
        } else {
          setGeneralError(data.error || "An error occurred during submission.");
        }
      } else {
        setSubmitResult(data);
      }
    } catch {
      setGeneralError("Failed to connect to the submission engine.");
    } finally {
      setIsRunning(false);
    }
  };

  if (!isMounted) {
    return <div className="h-full bg-[#1e1e1e] rounded-lg border border-border min-h-125" />;
  }

  const hasOutput = isRunning || executionResult || submitResult || generalError;

  return (
    <div className="flex flex-col h-full bg-background rounded-lg border border-border overflow-hidden">

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-[#1e1e1e] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#569cd6]">main</span>
          <span className="text-xs font-mono text-muted-foreground">.py</span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleRun} 
            variant="outline" 
            size="sm" 
            disabled={isRunning}
            className="h-8 border-border bg-transparent hover:bg-white/10 text-white gap-1.5"
          >
            {isRunning && !submitResult
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Play className="h-3.5 w-3.5 fill-green-500 text-green-500" />}
            Run
          </Button>
          <Button 
            onClick={handleSubmit} 
            size="sm" 
            disabled={isRunning}
            className="h-8 bg-[#00A8E8] hover:bg-[#0077B6] text-white border-0 gap-1.5"
          >
            {isRunning && submitResult === null && executionResult === null && generalError === null
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Send className="h-3.5 w-3.5" />}
            Submit
          </Button>
        </div>
      </div>

      {/* ── Editor Area ── */}
      <div className={`transition-all duration-300 ${outputOpen ? 'flex-3' : 'flex-1'} min-h-0`}>
        <Editor
          height="100%"
          language="python"
          theme="vs-dark"
          value={code}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineHeight: 22,
            wordWrap: "on",
            automaticLayout: true,
            tabSize: 4,
            padding: { top: 12, bottom: 12 },
            scrollBeyondLastLine: false,
            renderLineHighlight: "line",
            smoothScrolling: true,
          }}
        />
      </div>

      {/* ── Output Panel ── */}
      <div className={`border-t border-border bg-[#1a1a1a] flex flex-col shrink-0 transition-all duration-300 ${
        outputOpen ? 'flex-2 min-h-0 max-h-[55%]' : 'h-10'
      }`}>
        {/* Output header — always visible, acts as toggle */}
        <button
          onClick={() => setOutputOpen(o => !o)}
          className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer select-none shrink-0 w-full text-left"
        >
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wider text-[11px]">Output</span>
            {/* Status pill in header when collapsed */}
            {!outputOpen && hasOutput && !isRunning && (
              submitResult ? (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  submitResult.status === 'ACCEPTED'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {submitResult.status === 'ACCEPTED' ? '✓ Accepted' : '✗ ' + submitResult.status.replace(/_/g,' ')}
                </span>
              ) : executionResult && !executionResult.noTestCases ? (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  executionResult.success
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {executionResult.summary.passed}/{executionResult.summary.total} passed
                </span>
              ) : null
            )}
          </div>
          {outputOpen
            ? <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            : <ChevronUp className="h-3.5 w-3.5 opacity-60" />}
        </button>

        {/* Output body */}
        {outputOpen && (
          <div className="flex-1 overflow-y-auto min-h-0">
            {isRunning ? (
              /* ── Loading ── */
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p className="text-xs">Running your code…</p>
              </div>

            ) : submitResult ? (
              /* ── Submit Result ── */
              <div className="p-4 space-y-4">
                {/* Big status banner */}
                <div className={`rounded-lg p-4 flex items-center gap-4 ${
                  submitResult.status === 'ACCEPTED'
                    ? 'bg-green-500/10 border border-green-500/20'
                    : 'bg-red-500/10 border border-red-500/20'
                }`}>
                  {submitResult.status === 'ACCEPTED'
                    ? <Trophy className="h-8 w-8 text-green-400 shrink-0" />
                    : <XCircle className="h-8 w-8 text-red-400 shrink-0" />}
                  <div>
                    <div className={`text-base font-bold ${
                      submitResult.status === 'ACCEPTED' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {submitResult.status === 'ACCEPTED' ? 'Accepted' : submitResult.status.replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {submitResult.passedTests} / {submitResult.totalTests} test cases passed
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Score', value: `${submitResult.score}%` },
                    { label: 'Tests', value: `${submitResult.passedTests}/${submitResult.totalTests}` },
                    { label: 'Time', value: `${submitResult.executionTimeMs}ms` },
                  ].map(s => (
                    <div key={s.label} className="bg-white/5 rounded-lg p-3 text-center">
                      <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{s.label}</div>
                      <div className="text-sm font-bold font-mono text-gray-100">{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>

            ) : generalError ? (
              /* ── Config / connection error ── */
              <div className="flex flex-col items-center justify-center gap-3 py-10 px-6 text-center">
                <AlertCircle className="h-6 w-6 text-yellow-500/80" />
                <p className="text-xs text-yellow-500/90 max-w-xs leading-relaxed">{generalError}</p>
              </div>

            ) : executionResult ? (
              executionResult.noTestCases ? (
                /* ── No test cases configured ── */
                <div className="flex flex-col items-center justify-center gap-3 py-10 px-6 text-center">
                  <AlertCircle className="h-6 w-6 text-yellow-500/60" />
                  <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                    {executionResult.message || "No visible test cases have been configured for this problem yet."}
                  </p>
                </div>
              ) : (
                /* ── Run Results ── */
                <div className="p-3 space-y-2">
                  {/* Summary bar */}
                  <div className="flex items-center gap-2 mb-3">
                    {executionResult.success
                      ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                      : <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
                    <span className={`text-sm font-semibold ${executionResult.success ? 'text-green-400' : 'text-red-400'}`}>
                      {executionResult.success ? 'All tests passed' : 'Some tests failed'}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {executionResult.summary.passed} / {executionResult.summary.total} visible
                    </span>
                  </div>

                  {/* Test case accordion */}
                  <div className="space-y-1.5">
                    {executionResult.testCases.map((tc, idx) => (
                      <div key={idx} className={`rounded-md border overflow-hidden ${
                        tc.passed
                          ? 'border-green-500/20 bg-green-500/5'
                          : 'border-red-500/20 bg-red-500/5'
                      }`}>
                        {/* Accordion header */}
                        <button
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-white/5 transition-colors"
                          onClick={() => setExpandedTc(expandedTc === idx ? null : idx)}
                        >
                          {tc.passed
                            ? <CheckCircle className="h-3.5 w-3.5 text-green-400 shrink-0" />
                            : <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />}
                          <span className="text-xs font-medium text-gray-200">
                            Test Case {tc.testCaseNumber}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ml-1 ${
                            tc.passed ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                          }`}>
                            {tc.passed ? 'PASSED' : tc.status.replace(/_/g,' ')}
                          </span>
                          <span className="text-[10px] text-gray-400 ml-auto flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />{tc.executionTimeMs}ms
                          </span>
                          {expandedTc === idx
                            ? <ChevronUp className="h-3 w-3 text-gray-400" />
                            : <ChevronDown className="h-3 w-3 text-gray-400" />}
                        </button>

                        {/* Accordion body */}
                        {expandedTc === idx && (
                          <div className="px-3 pb-3 pt-1 space-y-2 border-t border-white/5">
                            {tc.status === 'TIMEOUT' && (
                              <p className="text-[11px] text-red-400 font-mono">⏱ Execution timed out (2s limit)</p>
                            )}
                            {tc.status === 'OUTPUT_LIMIT_EXCEEDED' && (
                              <p className="text-[11px] text-red-400 font-mono">⚠ Output exceeded the allowed limit</p>
                            )}
                            {tc.status === 'RUNTIME_ERROR' && (
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-red-400 mb-1">Runtime Error</p>
                                <pre className="text-[11px] font-mono text-red-300 bg-red-500/10 rounded p-2 whitespace-pre-wrap leading-relaxed">{tc.error}</pre>
                              </div>
                            )}

                            {tc.status !== 'RUNTIME_ERROR' && tc.status !== 'TIMEOUT' && tc.status !== 'OUTPUT_LIMIT_EXCEEDED' && (
                              <div className="grid grid-cols-2 gap-2">
                                {!tc.passed && (
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Expected</p>
                                    <pre className="text-[11px] font-mono bg-black/30 rounded p-2 whitespace-pre-wrap text-green-300 leading-relaxed">{tc.expectedOutput}</pre>
                                  </div>
                                )}
                                <div className={tc.passed ? 'col-span-2' : ''}>
                                  <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">
                                    {tc.passed ? 'Output' : 'Your Output'}
                                  </p>
                                  <pre className={`text-[11px] font-mono bg-black/30 rounded p-2 whitespace-pre-wrap leading-relaxed ${
                                    tc.passed ? 'text-green-300' : 'text-red-300'
                                  }`}>
                                    {tc.actualOutput !== undefined && tc.actualOutput !== ''
                                      ? tc.actualOutput
                                      : <span className="opacity-40 italic">(empty)</span>}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            ) : (
              /* ── Empty state ── */
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-gray-400">
                <Play className="h-5 w-5 opacity-20" />
                <p className="text-xs">Press <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded">Run</span> to see output</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
