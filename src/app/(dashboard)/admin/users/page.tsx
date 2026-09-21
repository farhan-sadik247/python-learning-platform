import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Search, Filter, ChevronRight, User as UserIcon } from "lucide-react";
import type { UserRole } from "@/generated/prisma/client";
import { formatDistanceToNow } from "date-fns";

export const metadata = {
  title: "User Management | Admin Dashboard",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; role?: string; page?: string }>;
}) {
  await requireRole(["ADMIN"]);
  
  const resolvedSearchParams = await searchParams;
  const search = resolvedSearchParams.search || "";
  const roleFilter = resolvedSearchParams.role || "ALL";
  const page = parseInt(resolvedSearchParams.page || "1", 10);
  const pageSize = 25;

  const where = {
    ...(search ? {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ]
    } : {}),
    ...(roleFilter !== "ALL" ? {
      roleAssignments: {
        some: {
          role: roleFilter as UserRole
        }
      }
    } : {})
  };

  const [users, totalUsers, totalAdmins, totalTeachers, totalStudents] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        roleAssignments: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
    prisma.userRoleAssignment.count({ where: { role: "ADMIN" } }),
    prisma.userRoleAssignment.count({ where: { role: "TEACHER" } }),
    prisma.userRoleAssignment.count({ where: { role: "STUDENT" } }),
  ]);

  const totalPages = Math.ceil(totalUsers / pageSize);

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "ADMIN": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "TEACHER": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "STUDENT": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">User Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage platform users and their roles.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card className="bg-background border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalUsers}</div>
          </CardContent>
        </Card>
        <Card className="bg-background border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-500 uppercase tracking-wider">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalAdmins}</div>
          </CardContent>
        </Card>
        <Card className="bg-background border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-500 uppercase tracking-wider">Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalTeachers}</div>
          </CardContent>
        </Card>
        <Card className="bg-background border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-500 uppercase tracking-wider">Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalStudents}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border border-border">
        <form className="flex w-full sm:max-w-sm items-center space-x-2" method="GET" action="/admin/users">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              name="search"
              placeholder="Search users..."
              defaultValue={search}
              className="w-full bg-background border border-border rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A8E8] text-foreground"
            />
          </div>
          <input type="hidden" name="role" value={roleFilter} />
          <Button type="submit" variant="secondary" className="bg-muted hover:bg-muted/80 text-foreground">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
            {["ALL", "ADMIN", "TEACHER", "STUDENT"].map(r => (
              <Link 
                key={r}
                href={`/admin/users?role=${r}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
              >
                <Badge 
                  variant={roleFilter === r ? "default" : "outline"}
                  className={roleFilter === r ? "bg-[#00A8E8] text-white hover:bg-[#0077B6]" : "border-border text-muted-foreground hover:bg-muted"}
                >
                  {r}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {users.length === 0 ? (
        <Card className="bg-background border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-card p-4 mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No users found</h3>
            <p className="text-muted-foreground max-w-sm">Try adjusting your search or filter criteria.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="border border-border rounded-md bg-card overflow-hidden">
          <div className="divide-y divide-border">
            {users.map(user => (
              <div key={user.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <UserIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground text-sm">{user.name}</h4>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Joined {formatDistanceToNow(user.createdAt, { addSuffix: true })}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 sm:justify-end">
                  <div className="flex gap-1 flex-wrap justify-end">
                    {user.roleAssignments.map(ra => (
                      <Badge key={ra.id} variant="outline" className={`${getRoleBadgeColor(ra.role)} text-[10px] h-5 px-1.5`}>
                        {ra.role}
                      </Badge>
                    ))}
                    {user.roleAssignments.length === 0 && (
                      <span className="text-xs text-muted-foreground italic">No roles</span>
                    )}
                  </div>
                  
                  <Link href={`/admin/users/${user.id}`}>
                    <Button variant="outline" size="sm" className="h-8 border-border text-muted-foreground hover:text-foreground">
                      Manage <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="bg-muted/30 p-4 border-t border-border flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={`/admin/users?page=${page - 1}${search ? `&search=${encodeURIComponent(search)}` : ""}${roleFilter !== "ALL" ? `&role=${roleFilter}` : ""}`}>
                    <Button variant="outline" size="sm" className="h-8 border-border">Previous</Button>
                  </Link>
                )}
                {page < totalPages && (
                  <Link href={`/admin/users?page=${page + 1}${search ? `&search=${encodeURIComponent(search)}` : ""}${roleFilter !== "ALL" ? `&role=${roleFilter}` : ""}`}>
                    <Button variant="outline" size="sm" className="h-8 border-border">Next</Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

