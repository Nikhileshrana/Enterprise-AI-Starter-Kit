import { redirect } from "next/navigation";
import { HomeLogin } from "@/components/home-login";
import { getCurrentSession } from "@/lib/auth/session";

export default async function Home() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/protected/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background px-6">
      <main className="flex flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Starter Kit
          </h1>
          <p className="max-w-sm text-muted-foreground">
            Sign in to open your workspace.
          </p>
        </div>
        <HomeLogin />
      </main>
    </div>
  );
}
