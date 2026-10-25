"use client";
import type { ReactNode } from "react";
import { sileo, Toaster as SileoToaster } from "sileo";
type ToastType = "success" | "error" | "warning" | "info";
type ToastOptions = {
  title: string;
  description?: ReactNode;
  type?: ToastType;
};
const headings: Record<ToastType, string> = {
  success: "Success",
  error: "Unable to complete",
  warning: "Please check",
  info: "Update",
};
export const toast = {
  add({ title, description, type = "info" }: ToastOptions) {
    // Every toast has a short heading and a readable message in its expanded body.
    const messageAsDescription = !description || title.length > 30;
    return sileo[type]({
      title: messageAsDescription ? headings[type] : title,
      description: messageAsDescription ? (
        <>
          {title}
          {description && <div className="mt-2">{description}</div>}
        </>
      ) : (
        description
      ),
      position: "bottom-right",
      fill: "var(--coms-toast-surface)",
      duration: type === "error" || type === "warning" ? 8000 : 6000,
      autopilot: { expand: 120, collapse: 0 },
    });
  },
  dismiss: sileo.dismiss,
  clear: () => sileo.clear(),
};
export function Toaster() {
  return (
    <SileoToaster position="bottom-right" visibleToasts={3} theme="dark" />
  );
}
