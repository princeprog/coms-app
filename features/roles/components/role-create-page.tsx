"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RoleCreateForm } from "@/features/roles/components/role-create-form";
import { RoleDiscardConfirmation } from "@/features/roles/components/role-discard-confirmation";
import { RoleWorkspace } from "@/features/roles/components/role-workspace";
import { useRoleDraftGuard } from "@/features/roles/hooks/use-role-draft-guard";
import type { Permission } from "@/features/roles/types/role.types";
import { toast } from "sonner";

export function RoleCreatePage({ permissions }: { permissions: Permission[] }) {
  const router = useRouter();
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState(false);
  const guard = useRoleDraftGuard(dirty, pending);

  return (
    <RoleWorkspace
      title="Create role"
      description="Define a role and choose its permissions."
      onBack={guard.requestLeave}
      pending={pending}
    >
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
    </RoleWorkspace>
  );
}
