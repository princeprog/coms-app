"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { RoleCreateForm } from "@/features/roles/components/role-create-form";
import { RoleDiscardConfirmation } from "@/features/roles/components/role-discard-confirmation";
import { useRoleDraftGuard } from "@/features/roles/hooks/use-role-draft-guard";
import type { Permission } from "@/features/roles/types/role.types";
import { toast } from "sonner";

export function RoleCreatePage({ permissions }: { permissions: Permission[] }) {
  const router = useRouter();
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState(false);
  const guard = useRoleDraftGuard(dirty, pending);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="grid gap-1">
          <h2 className="text-lg font-semibold">Create role</h2>
          <p className="text-sm text-muted-foreground">
            Define a custom role and grant only the access its staff need.
          </p>
        </div>
        <Link
          href="/roles"
          aria-disabled={pending}
          className={buttonVariants({ variant: "outline" })}
          onClick={(event) => {
            event.preventDefault();
            guard.requestLeave();
          }}
        >
          <ArrowLeft data-icon="inline-start" />
          Back to roles
        </Link>
      </header>

      <RoleCreateForm
        permissions={permissions}
        onCancel={guard.requestLeave}
        onDirtyChange={setDirty}
        onPendingChange={setPending}
        onComplete={() => {
          setDirty(false);
          toast.success("Role created.");
          router.push("/roles");
        }}
      />

      <RoleDiscardConfirmation
        open={guard.confirmDiscard}
        onOpenChange={guard.setConfirmDiscard}
        onDiscard={guard.discardAndLeave}
      />
    </div>
  );
}
