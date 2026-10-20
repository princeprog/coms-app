"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { purchasesRoute } from "../routes";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PurchaseCreateDialog } from "./purchase-create-dialog";
export function PurchaseActions({
  canCreate,
  canRead,
  showHistory = true,
}: {
  canCreate: boolean;
  canRead: boolean;
  showHistory?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      {canRead && showHistory && (
        <Button variant="outline" render={<Link href={purchasesRoute} />}>
          View purchases
        </Button>
      )}
      {canCreate && (
        <Button ref={trigger} onClick={() => setOpen(true)}>
          <Plus aria-hidden="true" />
          Restock
        </Button>
      )}
      {open && (
        <PurchaseCreateDialog
          onClose={() => {
            setOpen(false);
            requestAnimationFrame(() => trigger.current?.focus());
          }}
        />
      )}
    </div>
  );
}
