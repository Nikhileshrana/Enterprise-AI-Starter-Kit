"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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

const moduleGroups = [
  {
    title: "Core",
    modules: ["Next.js 16", "React 19", "TypeScript", "Tailwind v4", "Biome"],
  },
  {
    title: "Auth",
    modules: ["Better Auth", "Google OAuth", "Sessions", "Protected routes"],
  },
  {
    title: "Multi-tenancy",
    modules: ["Organizations", "RBAC", "Invitations", "Member settings"],
  },
  {
    title: "Data",
    modules: ["MongoDB", "Chat history", "Vercel Blob"],
  },
  {
    title: "AI platform",
    modules: ["AI SDK v7", "AI Gateway", "Tool-loop agent", "Streaming chat"],
  },
  {
    title: "AI tools",
    modules: ["Generative UI", "Approvals", "Web search", "Artifacts", "Export"],
  },
  {
    title: "UI",
    modules: ["shadcn/ui", "Themes", "Sidebar", "Data tables", "Charts"],
  },
] as const;

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
    <div className="flex h-svh overflow-hidden bg-background text-foreground lg:flex-row">
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

      <div className="flex min-h-0 flex-1 flex-col justify-center gap-5 border-t border-border px-6 py-6 sm:gap-6 sm:px-8 lg:max-w-xl lg:border-t-0 lg:border-l lg:px-10 xl:max-w-2xl">
        <div className="flex flex-col gap-1.5">
          <p className="text-[0.625rem] font-medium tracking-[0.28em] text-muted-foreground uppercase">
            Enterprise ready AI starter kit
          </p>
          <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
            Ship high-end enterprise applications
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Auth, multi-tenancy, AI agents, storage, and a full UI system —
            wired together out of the box.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
          {moduleGroups.map((group) => (
            <section key={group.title} className="flex flex-col gap-1">
              <h2 className="text-[0.625rem] font-medium tracking-wide text-muted-foreground uppercase">
                {group.title}
              </h2>
              <div className="flex flex-wrap gap-1">
                {group.modules.map((module) => (
                  <Badge
                    key={module}
                    variant="secondary"
                    className="px-1.5 py-0 text-[0.625rem] font-normal"
                  >
                    {module}
                  </Badge>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="flex flex-col items-center gap-4 border-t border-border pt-5">
          {isPending ? (
            <Skeleton className="h-11 w-56 rounded-full" />
          ) : !session ? (
            <>
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
            </>
          ) : (
            <div className="flex w-full max-w-sm flex-col items-center gap-4">
              <Item variant="outline" className="w-full">
                <ItemMedia>
                  <Avatar>
                    {session.user.image ? (
                      <AvatarImage
                        src={session.user.image}
                        alt={session.user.name}
                      />
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
          <p className="text-center text-[0.625rem] text-muted-foreground">
            By continuing you agree to the Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
