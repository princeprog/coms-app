"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export function useQuickCreateDialog() {
  const searchParams = useSearchParams();
  const requestedFromSidebar = searchParams.get("create") === "1";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // The sidebar can navigate to this route while its create form stays mounted.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (requestedFromSidebar) setOpen(true);
  }, [requestedFromSidebar]);

  function closeDialog() {
    if (requestedFromSidebar) {
      const url = new URL(window.location.href);
      url.searchParams.delete("create");
      window.history.replaceState(null, "", url);
    }
    setOpen(false);
  }

  return {
    open,
    openDialog: () => setOpen(true),
    closeDialog,
  };
}
