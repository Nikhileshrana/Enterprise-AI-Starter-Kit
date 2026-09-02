"use client";

import { useState } from "react";
import { GalleryVerticalEndIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { signIn } from "@/lib/auth/client";

export default function SignInPage() {
  const [pending, setPending] = useState(false);

  async function handleGoogle() {
    setPending(true);
    await signIn.social({
      provider: "google",
      callbackURL: "/protected/dashboard",
    });
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 p-6">
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
            onClick={handleGoogle}
          >
            {pending ? <Spinner data-icon="inline-start" /> : null}
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
