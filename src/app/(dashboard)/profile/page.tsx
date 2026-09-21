import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";
import { PasswordForm } from "./password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User as UserIcon, Lock } from "lucide-react";

export const metadata = {
  title: "My Profile | Python Learning Platform",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">My Profile</h2>
        <p className="text-muted-foreground mt-1">Manage your account information and preferences.</p>
      </div>

      <Card className="bg-background border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-[#00A8E8]" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Update your basic profile details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm user={{ id: user.id, name: user.name, email: user.email }} />
        </CardContent>
      </Card>

      <Card className="bg-background border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-[#00A8E8]" />
            Security
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}

