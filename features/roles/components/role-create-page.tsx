"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
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
    <div className="flex h-full min-h-0 flex-col gap-3 lg:gap-4">
      <header className="grid shrink-0 gap-2">
        <Link
          href="/roles"
          aria-disabled={pending}
          className="flex w-fit items-center gap-2 text-sm font-medium text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          onClick={(event) => {
            event.preventDefault();
            guard.requestLeave();
          }}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to roles
        </Link>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Create role
          </h2>
          <p className="text-sm text-muted-foreground md:text-base">
            Define a role and choose its permissions.
          </p>
        </div>
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
