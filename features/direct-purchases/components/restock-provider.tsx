"use client";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { PurchaseStock } from "../schemas/purchase.schema";
import { PurchaseCreateDialog } from "./purchase-create-dialog";

type RestockContextValue = {
  openRestock: (
    stock?: PurchaseStock | null,
    returnFocus?: HTMLElement | null,
  ) => void;
};

const RestockContext = createContext<RestockContextValue | null>(null);

/** Returns the restock opener, or null when the user cannot restock here. */
export function useRestock() {
  return useContext(RestockContext);
}

export function RestockProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  const [session, setSession] = useState<{
    key: number;
    stock: PurchaseStock | null;
  } | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const sessions = useRef(0);
  const openRestock = useCallback(
    (stock: PurchaseStock | null = null, focusTarget?: HTMLElement | null) => {
      returnFocus.current =
        focusTarget ??
        (document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null);
      sessions.current += 1;
      setSession({ key: sessions.current, stock });
    },
    [],
  );
  const value = useMemo(
    () => (enabled ? { openRestock } : null),
    [enabled, openRestock],
  );
  return (
    <RestockContext.Provider value={value}>
      {children}
      {session && (
        <PurchaseCreateDialog
          key={session.key}
          initialStock={session.stock}
          onClose={() => {
            setSession(null);
            const target = returnFocus.current;
            requestAnimationFrame(() => {
              if (target?.isConnected) target.focus();
            });
          }}
        />
      )}
    </RestockContext.Provider>
  );
}
