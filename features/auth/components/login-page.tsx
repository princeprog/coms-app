"use client";

import Image from "next/image";
import { cn } from "cn";

import { LoginForm } from "@/features/auth/components/login-form/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// One-time page entrance: sections rise in with a short stagger. Reduced
// motion keeps the fade and drops the movement.
const enterClassName =
  "animate-in fill-mode-both duration-500 ease-out-quint fade-in-0 motion-safe:slide-in-from-bottom-2";

// The theme class is set before paint, so CSS picks the matching background
// without a flash. Both stay lazy so the hidden one is never downloaded.
const backgrounds = [
  { src: "/images/login-bg.png", className: "dark:hidden" },
  { src: "/images/login-bg-dark.png", className: "hidden dark:block" },
];

export function LoginPage() {
  return (
    <main className="relative isolate flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 py-8 text-foreground sm:px-6">
      {backgrounds.map((background) => (
        <Image
          key={background.src}
          src={background.src}
          alt=""
          fill
          sizes="100vw"
          aria-hidden="true"
          className={cn("object-cover object-center", background.className)}
        />
      ))}

      <Card
        className={cn(
          "relative z-10 w-full max-w-md bg-card/95 shadow-xl shadow-foreground/5 backdrop-blur-sm motion-safe:zoom-in-98",
          enterClassName,
        )}
      >
        <CardHeader
          className={cn(
            "items-center gap-2 px-6 pt-8 text-center delay-75 sm:px-12 sm:pt-10",
            enterClassName,
          )}
        >
          <Image
            src="/images/emmas%20chicken%20house%20logo.png"
            alt="Emma's Chicken House"
            width={390}
            height={170}
            priority
            className="mx-auto mb-3 h-auto w-full max-w-64 object-contain"
          />
          <h1 className="font-heading text-xl font-semibold tracking-tight text-balance">
            Welcome back
          </h1>
          <CardDescription className="text-sm sm:text-base">
            Sign in to continue
          </CardDescription>
        </CardHeader>

        <CardContent
          className={cn("px-6 pt-2 delay-150 sm:px-12", enterClassName)}
        >
          <div className="mx-auto w-full max-w-xl">
            <LoginForm />
          </div>
        </CardContent>

        <CardFooter
          className="mx-auto flex w-full max-w-md items-center gap-4 px-6 pb-6 sm:px-12 sm:pb-8"
          aria-hidden="true"
        >
          <Separator className="flex-1" />
          <span className="text-[0.65rem] font-medium uppercase tracking-[0.25em] text-muted-foreground">
            Good food fuels great people
          </span>
          <Separator className="flex-1" />
        </CardFooter>
      </Card>
    </main>
  );
}
