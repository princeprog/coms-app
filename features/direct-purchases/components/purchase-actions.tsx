"use client";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { purchasesRoute } from "../routes";
import { useRestock } from "./restock-provider";

export function PurchaseActions({
  canRead,
  showHistory = true,
}: {
  canRead: boolean;
  showHistory?: boolean;
}) {
  const restock = useRestock();
  if (!restock && !(canRead && showHistory)) return null;
  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      {canRead && showHistory && (
        <Button variant="outline" render={<Link href={purchasesRoute} />}>
          View purchases
        </Button>
      )}
      {restock && (
        <Button
          onClick={(event) => restock.openRestock(null, event.currentTarget)}
        >
          <Plus aria-hidden="true" />
          Restock
        </Button>
      )}
    </div>
  );
}
