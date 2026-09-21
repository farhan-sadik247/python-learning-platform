"use client";

import { useState, useTransition } from "react";
import { UserRole } from "@/generated/prisma/client";
import { addRoleAction, removeRoleAction } from "@/app/actions/users";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { Shield, Plus, X, Loader2, ShieldAlert } from "lucide-react";

interface UserRoleManagerProps {
  userId: string;
  assignedRoles: UserRole[];
}

export function UserRoleManager({ userId, assignedRoles }: UserRoleManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const availableRoles: UserRole[] = ["ADMIN", "TEACHER", "STUDENT"];
  
  const handleAddRole = (role: UserRole) => {
    setError(null);
    startTransition(async () => {
      try {
        await addRoleAction(userId, role);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to add role");
      }
    });
  };

  const handleRemoveRole = (role: UserRole) => {
    setError(null);
    if (role === "ADMIN") {
      if (!confirm("Are you sure you want to remove ADMIN privileges from this user?")) {
        return;
      }
    }
    startTransition(async () => {
      try {
        await removeRoleAction(userId, role);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to remove role");
      }
    });
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "ADMIN": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "TEACHER": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "STUDENT": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card className="bg-background border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-[#00A8E8]" />
          Role Management
        </CardTitle>
        <CardDescription>
          Assign or remove platform roles for this user.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 flex items-start gap-2 text-sm text-red-500">
            <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Assigned Roles</h4>
            {assignedRoles.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No roles assigned.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {assignedRoles.map(role => (
                  <div key={role} className={`flex items-center gap-1 pl-3 pr-1 py-1 rounded-full border ${getRoleBadgeColor(role)}`}>
                    <span className="text-xs font-semibold mr-1">{role}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`h-5 w-5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
                      onClick={() => handleRemoveRole(role)}
                      disabled={isPending}
                      title={`Remove ${role} role`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-border">
            <h4 className="text-sm font-medium text-foreground mb-3">Available to Add</h4>
            <div className="flex flex-wrap gap-2">
              {availableRoles.filter(r => !assignedRoles.includes(r)).map(role => (
                <Button 
                  key={role}
                  variant="outline"
                  size="sm"
                  className={`h-8 border-border text-xs ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
                  onClick={() => handleAddRole(role)}
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
                  Add {role}
                </Button>
              ))}
              {availableRoles.filter(r => !assignedRoles.includes(r)).length === 0 && (
                <p className="text-sm text-muted-foreground italic">User has all available roles.</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
