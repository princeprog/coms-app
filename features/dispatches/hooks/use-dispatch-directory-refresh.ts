"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Keep the server-filtered directory current without a second receiving list.
export function useDispatchDirectoryRefresh(busy: boolean) {
  const router = useRouter();
  useEffect(() => {
    if (busy) return;
    const refresh = () => {
      if (!document.hidden) router.refresh();
    };
    const timer = setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [busy, router]);
}
