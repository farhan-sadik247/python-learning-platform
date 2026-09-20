import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center bg-[#111827] border border-[#263244] rounded-lg", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1F2937] text-slate-400 mb-4">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-medium text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm">
        {description}
      </p>
    </div>
  );
}
