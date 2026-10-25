"use client";
import type { ReactNode } from "react";
import { useTheme } from "next-themes";
import { sileo, Toaster as SileoToaster } from "sileo";
type ToastType = "success" | "error" | "warning" | "info";
type ToastOptions = {
  title: string;
  description?: ReactNode;
  type?: ToastType;
};
const headings: Record<ToastType, string> = {
  success: "Completed",
  error: "Unable to complete",
  warning: "Please check",
  info: "Update",
};
export const toast = {
  add({ title, description, type = "info" }: ToastOptions) {
    // Dynamic names and server messages must remain readable on narrow screens.
    const longTitle = title.length > 30;
    return sileo[type]({
      title: longTitle ? headings[type] : title,
      description: longTitle ? (
        <>
          {title}
          {description && <div className="mt-2">{description}</div>}
        </>
      ) : (
        description
      ),
      position: "bottom-right",
      fill: "var(--popover)",
      duration: type === "error" || type === "warning" ? 8000 : 6000,
      autopilot: { expand: 150, collapse: 0 },
    });
  },
  dismiss: sileo.dismiss,
  clear: () => sileo.clear(),
};
export function Toaster() {
  const { resolvedTheme } = useTheme();
  return (
    <SileoToaster
      position="bottom-right"
      visibleToasts={3}
      theme={resolvedTheme === "dark" ? "dark" : "light"}
    />
  );
}
