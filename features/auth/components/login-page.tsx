"use client";

import Image from "next/image";

import { LoginForm } from "@/features/auth/components/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function LoginPage() {
  return (
    <main className="relative isolate flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 py-8 text-foreground sm:px-6">
      <Image
        src="/images/login-bg.png"
        alt=""
        fill
        priority
        sizes="100vw"
        aria-hidden="true"
        className="object-cover object-center"
      />

      <Card className="relative z-10 w-full max-w-md bg-card/95 shadow-lg backdrop-blur-sm">
        <CardHeader className="items-center px-6 pt-8 text-center sm:px-12 sm:pt-12">
          <Image
            src="/images/emmas%20chicken%20house%20logo.png"
            alt="Emma's Chicken House"
            width={390}
            height={170}
            priority
            className="mx-auto mb-2 h-auto w-full max-w-md object-contain"
          />
          <CardDescription className="text-base sm:text-lg">
            Sign in to continue
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 sm:px-12">
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
