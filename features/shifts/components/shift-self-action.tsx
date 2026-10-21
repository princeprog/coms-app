"use client";

import Link from "next/link";
import { LockKeyhole, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMyShift } from "../hooks/use-my-shift";

export function ShiftSelfAction() {
  const mine = useMyShift();
  if (mine.isPending || mine.isError) return null;
  return mine.data ? (
    <Button
      variant="outline"
      className="min-h-10 gap-2"
      nativeButton={false}
      render={<Link href="/shifts/end" />}
    >
      <LockKeyhole data-icon="inline-start" aria-hidden="true" />
      End shift
    </Button>
  ) : (
    <Button
      className="min-h-10 gap-2"
      nativeButton={false}
      render={<Link href="/shifts/start" />}
    >
      <PlayCircle data-icon="inline-start" aria-hidden="true" />
      Start shift
    </Button>
  );
}
