"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, ChevronDown, ChevronUp } from "lucide-react";

interface HintCardProps {
  hints?: string | null;
}

export function HintCard({ hints }: HintCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!hints || hints.trim() === "") {
    return null; // Hide entirely if no hints
  }

  return (
    <div className="mt-8">
      <Card className="bg-background border-border overflow-hidden">
        <div 
          className="p-4 flex justify-between items-center cursor-pointer hover:bg-card transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <h3 className="font-semibold text-foreground">Hint</h3>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        {isOpen && (
          <CardContent className="p-4 pt-0 border-t border-border mt-2 bg-card/50">
            <div className="prose max-w-none text-muted-foreground prose-sm mt-4">
              {hints.split('\n').map((paragraph, idx) => (
                <p key={idx} className="whitespace-pre-wrap">{paragraph}</p>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

