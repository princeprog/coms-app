"use client";
import { useAuthEvents } from "@/features/auth/hooks/use-auth-events";

export function AuthEvents() {
  useAuthEvents();
  return null;
}
