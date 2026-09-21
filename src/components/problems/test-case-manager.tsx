"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createProblemTestCaseAction, updateProblemTestCaseAction, deleteProblemTestCaseAction } from "@/app/actions/problem-test-cases";
import { Loader2, Plus, Edit2, Trash2, Eye, EyeOff } from "lucide-react";
import type { ProblemTestCase } from "@/generated/prisma/client";

interface TestCaseManagerProps {
  problemId: string;
  testCases: ProblemTestCase[];
}

export function TestCaseManager({ problemId, testCases }: TestCaseManagerProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setErrors({});
    
    const formData = new FormData(e.currentTarget);
    const isHidden = formData.get("isHidden") === "on";
    formData.set("isHidden", isHidden ? "true" : "false");

    let result;
    if (editingId) {
      result = await updateProblemTestCaseAction(problemId, editingId, null, formData);
    } else {
      result = await createProblemTestCaseAction(problemId, null, formData);
    }

    if (result?.errors) {
      setErrors(result.errors);
      setIsPending(false);
    } else if (result?.message) {
      setEditingId(null);
      setIsCreating(false);
      router.refresh();
      setIsPending(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this test case?")) return;
    setIsPending(true);
    const result = await deleteProblemTestCaseAction(problemId, id);
    if (!result?.errors) {
      router.refresh();
    }
    setIsPending(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-foreground">Test Cases</h3>
        {!isCreating && !editingId && (
          <Button onClick={() => setIsCreating(true)} variant="outline" size="sm" className="border-border text-foreground">
            <Plus className="mr-2 h-4 w-4" /> Add Test Case
          </Button>
        )}
      </div>

      {(isCreating || editingId) && (
        <Card className="bg-background border-border">
          <CardHeader>
            <CardTitle className="text-base text-foreground">
              {editingId ? "Edit Test Case" : "New Test Case"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              {errors.general && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-md text-sm">
                  {errors.general.join(", ")}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="input">Input</Label>
                <Textarea 
                  id="input" 
                  name="input" 
                  defaultValue={editingId ? testCases.find(tc => tc.id === editingId)?.input : ""} 
                  disabled={isPending}
                  className="font-mono text-sm"
                  rows={2}
                />
                {errors.input && <p className="text-sm text-red-500">{errors.input[0]}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedOutput">Expected Output *</Label>
                <Textarea 
                  id="expectedOutput" 
                  name="expectedOutput" 
                  defaultValue={editingId ? testCases.find(tc => tc.id === editingId)?.expectedOutput : ""} 
                  disabled={isPending}
                  required
                  className="font-mono text-sm"
                  rows={2}
                />
                {errors.expectedOutput && <p className="text-sm text-red-500">{errors.expectedOutput[0]}</p>}
              </div>

              {editingId && (
                 <div className="space-y-2 hidden">
                   <Input type="hidden" name="order" value={testCases.find(tc => tc.id === editingId)?.order || 0} />
                 </div>
              )}

              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="isHidden" 
                  name="isHidden" 
                  defaultChecked={editingId ? testCases.find(tc => tc.id === editingId)?.isHidden : false} 
                  disabled={isPending}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="isHidden">Hidden Test Case</Label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingId(null);
                    setErrors({});
                  }}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  size="sm"
                  disabled={isPending}
                  className="bg-[#00A8E8] hover:bg-[#0077B6] text-foreground"
                >
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!isCreating && !editingId && testCases.length === 0 && (
        <div className="text-center p-8 border border-border border-dashed rounded-lg text-muted-foreground">
          No test cases yet. Add one to test student code.
        </div>
      )}

      {!isCreating && !editingId && testCases.map((tc, idx) => (
        <Card key={tc.id} className="bg-background border-border relative group">
          <CardContent className="p-4 flex gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground">Test Case #{idx + 1}</span>
                {tc.isHidden ? (
                  <span className="flex items-center text-xs px-2 py-1 bg-red-500/10 text-red-500 rounded-full">
                    <EyeOff className="h-3 w-3 mr-1" /> Hidden
                  </span>
                ) : (
                  <span className="flex items-center text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded-full">
                    <Eye className="h-3 w-3 mr-1" /> Visible
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1 uppercase font-semibold">Input</div>
                  <pre className="text-xs p-2 rounded bg-muted overflow-x-auto whitespace-pre-wrap font-mono text-foreground">{tc.input || <span className="text-muted-foreground/50 italic">None</span>}</pre>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1 uppercase font-semibold">Expected Output</div>
                  <pre className="text-xs p-2 rounded bg-muted overflow-x-auto whitespace-pre-wrap font-mono text-foreground">{tc.expectedOutput}</pre>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 justify-start shrink-0">
              <Button onClick={() => setEditingId(tc.id)} variant="outline" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button onClick={() => handleDelete(tc.id)} variant="outline" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

