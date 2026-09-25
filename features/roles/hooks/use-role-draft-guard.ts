"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useRoleDraftGuard(isDirty: boolean, isPending: boolean) {
  const router = useRouter();
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  useEffect(() => {
    if (!isDirty) return;

    function warnBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [isDirty]);

  const requestLeave = useCallback(() => {
    if (isPending) return;
    if (isDirty) {
      setConfirmDiscard(true);
      return;
    }
    router.push("/roles");
  }, [isDirty, isPending, router]);

  const discardAndLeave = useCallback(() => {
    setConfirmDiscard(false);
    router.push("/roles");
  }, [router]);

  return {
    confirmDiscard,
    setConfirmDiscard,
    requestLeave,
    discardAndLeave,
  };
}
