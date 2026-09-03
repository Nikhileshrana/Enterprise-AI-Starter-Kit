"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { signIn, useSession } from "@/lib/auth/client";

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

function safeCallbackURL(value: string | null) {
  if (!value) return "/protected/dashboard";
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/protected/dashboard";
  }
  return value;
}

function GoogleIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" {...props}>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function LoginButton() {
  const searchParams = useSearchParams();
  const callbackURL = safeCallbackURL(searchParams.get("callbackURL"));
  const [pending, setPending] = useState(false);

  async function handleLogin() {
    setPending(true);
    await signIn.social({
      provider: "google",
      callbackURL,
    });
  }

  return (
    <Button
      size="lg"
      className="h-11 min-w-56 rounded-full px-8"
      disabled={pending}
      onClick={() => void handleLogin()}
    >
      {pending ? (
        <Spinner data-icon="inline-start" />
      ) : (
        <GoogleIcon data-icon="inline-start" />
      )}
      Sign in with Google
    </Button>
  );
}

export default function Home() {
  const { data: session, isPending } = useSession();

  return (
    <div className="flex min-h-svh flex-1 bg-background text-foreground">
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <Image
          src="/logo.svg"
          alt=""
          width={720}
          height={720}
          unoptimized
          priority
          className="h-auto w-full max-w-md lg:max-w-xl"
        />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
        <h1 className="font-heading text-2xl font-semibold tracking-[0.28em] uppercase">
          Starter Kit
        </h1>
        {isPending ? (
          <Skeleton className="h-36 w-full max-w-sm" />
        ) : !session ? (
          <div className="flex w-full max-w-sm flex-col items-center gap-8">
            <p className="text-center text-sm text-foreground">
              Sign in to continue to your workspace.
            </p>
            <Suspense
              fallback={
                <Button
                  size="lg"
                  className="h-11 min-w-56 rounded-full px-8"
                  disabled
                >
                  <Spinner data-icon="inline-start" />
                  Sign in with Google
                </Button>
              }
            >
              <LoginButton />
            </Suspense>
          </div>
        ) : (
          <div className="flex w-full max-w-sm flex-col items-center gap-8">
            <Item variant="outline" className="w-full">
              <ItemMedia>
                <Avatar>
                  {session.user.image ? (
                    <AvatarImage src={session.user.image} alt={session.user.name} />
                  ) : null}
                  <AvatarFallback>{initials(session.user.name)}</AvatarFallback>
                </Avatar>
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{session.user.name}</ItemTitle>
              </ItemContent>
              <ItemActions>
                <span className="text-muted-foreground">Signed in</span>
              </ItemActions>
            </Item>
            <p className="text-center text-sm text-foreground">
              Continue to your workspace to chat, create artifacts, and work with
              your team.
            </p>
            <Button
              nativeButton={false}
              render={<Link href="/protected/dashboard" />}
              size="lg"
              className="h-11 min-w-56 rounded-full px-8"
            >
              Continue to workspace
            </Button>
          </div>
        )}
        <p className="max-w-xs text-center text-[0.625rem] text-muted-foreground">
          By continuing you agree to the Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
