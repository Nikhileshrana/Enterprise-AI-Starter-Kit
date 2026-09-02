import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { OrganizationDialog } from "@/components/organization-dialog";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentSession } from "@/lib/auth/session";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<ProtectedShellFallback />}>
      <ProtectedShell>{children}</ProtectedShell>
    </Suspense>
  );
}

async function ProtectedShell({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/sign-in");
  }

  const user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image ?? null,
  };

  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <AppSidebar user={user} />
      <SidebarInset className="min-h-0 overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4">
          {children}
        </div>
      </SidebarInset>
      <OrganizationDialog userId={user.id} />
    </SidebarProvider>
  );
}

function ProtectedShellFallback() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Skeleton className="h-10 w-48" />
    </div>
  );
}
