import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PwaCard({
  placement,
  title,
  description,
  closeLabel,
  onClose,
  children,
}: {
  placement: "floating" | "sidebar";
  title: string;
  description: React.ReactNode;
  closeLabel: string;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  return (
    <section
      aria-label="COMS app"
      className={cn(
        "relative flex gap-3 border bg-background text-foreground",
        "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-200",
        placement === "floating"
          ? "fixed inset-x-3 bottom-3 z-40 rounded-2xl p-4 shadow-lg sm:inset-x-auto sm:bottom-4 sm:left-4 sm:w-80"
          : "rounded-xl p-3 shadow-xs",
      )}
    >
      <Image
        src="/pwa/icon-192.png"
        alt="Emma's Chicken House mascot"
        width={44}
        height={44}
        className="size-11 shrink-0 rounded-xl"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2 pr-5">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold leading-5">{title}</h2>
          <div className="text-xs leading-5 text-muted-foreground">
            {description}
          </div>
        </div>
        {children}
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={closeLabel}
        className="absolute top-2 right-2 text-muted-foreground"
        onClick={onClose}
      >
        <X aria-hidden="true" />
      </Button>
    </section>
  );
}
