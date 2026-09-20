"use client";

import Image from "next/image";
import * as React from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function LoginPage() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(true);

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-8 text-foreground sm:px-6">
      <Card className="w-full max-w-md">
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
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => event.preventDefault()}
            >
              <FieldGroup className="gap-3">
                <Field>
                  <FieldLabel htmlFor="email" className="sr-only">
                    Email
                  </FieldLabel>
                  <InputGroup className="h-11">
                    <InputGroupAddon>
                      <Mail aria-hidden="true" />
                    </InputGroupAddon>
                    <InputGroupInput
                      id="email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      placeholder="Email"
                      aria-label="Email"
                    />
                  </InputGroup>
                </Field>

                <Field>
                  <FieldLabel htmlFor="password" className="sr-only">
                    Password
                  </FieldLabel>
                  <InputGroup className="h-11">
                    <InputGroupAddon>
                      <LockKeyhole aria-hidden="true" />
                    </InputGroupAddon>
                    <InputGroupInput
                      id="password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete="current-password"
                      placeholder="Password"
                      aria-label="Password"
                    />
                    <InputGroupButton
                      variant="ghost"
                      size="icon-sm"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((visible) => !visible)}
                    >
                      {showPassword ? (
                        <EyeOff aria-hidden="true" />
                      ) : (
                        <Eye aria-hidden="true" />
                      )}
                    </InputGroupButton>
                  </InputGroup>
                </Field>
              </FieldGroup>

              <Field
                orientation="horizontal"
                className="items-center justify-between gap-4"
              >
                <Label
                  htmlFor="remember-me"
                  className="cursor-pointer text-muted-foreground"
                >
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) =>
                      setRememberMe(checked === true)
                    }
                  />
                  Remember me
                </Label>
                <Button type="button" variant="link" className="h-auto px-0">
                  Forgot password?
                </Button>
              </Field>

              <Button type="submit" size="lg" className="w-full">
                Sign In
                <ArrowRight data-icon="inline-end" aria-hidden="true" />
              </Button>
            </form>
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
