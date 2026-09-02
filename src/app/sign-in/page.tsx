"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GalleryVerticalEndIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { signIn } from "@/lib/auth/client";

function safeCallbackURL(value: string | null) {
  if (!value) return "/protected/dashboard";
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/protected/dashboard";
  }
  return value;
}

function SignInForm() {
  const searchParams = useSearchParams();
  const callbackURL = safeCallbackURL(searchParams.get("callbackURL"));
  const [pending, setPending] = useState(false);

  async function handleGoogle() {
    setPending(true);
    await signIn.social({
      provider: "google",
      callbackURL,
    });
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <GalleryVerticalEndIcon />
        </div>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Continue with Google to access your workspace.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          className="w-full"
          disabled={pending}
          onClick={() => void handleGoogle()}
        >
          {pending ? <Spinner data-icon="inline-start" /> : null}
          Continue with Google
        </Button>
      </CardContent>
    </Card>
  );
}

export default function SignInPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 p-6">
      <Suspense
        fallback={
          <div className="w-full max-w-sm rounded-xl border bg-card p-6">
            <Skeleton className="mx-auto mb-4 size-10 rounded-lg" />
            <Skeleton className="mx-auto mb-2 h-6 w-24" />
            <Skeleton className="mx-auto mb-6 h-4 w-48" />
            <Skeleton className="h-9 w-full" />
          </div>
        }
      >
        <SignInForm />
      </Suspense>
    </div>
  );
}
