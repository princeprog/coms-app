import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import {
  hasPermission,
  hasBranchScope,
  isProtectedSuperAdmin,
} from "@/features/auth/permissions";
import { getBranchOptions } from "@/features/branch-products/services/branch-product-queries";
import { OperationalLoadError } from "@/components/shared/operational-load-error";
import { ApiRequestError } from "@/services/api-services";
import {
  getProductSetup,
  getProductBranchPage,
} from "../services/product-setup-queries";
import { ProductSetupWorkspace } from "./product-setup-workspace";
import type {
  ProductSetup,
  SetupBranch,
} from "../schemas/product-setup.schema";
export async function ProductSetupPage({
  id,
  details = false,
}: {
  id?: string;
  details?: boolean;
}) {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status !== "authenticated")
    return <AuthServiceError context="dashboard" />;
  const user = session.user,
    canManage = isProtectedSuperAdmin(user);
  if ((!id && !canManage) || (id && !hasPermission(user, "products.read")))
    notFound();
  if (id && !z.uuid().safeParse(id).success) notFound();
  let initial: ProductSetup | null = null,
    branches: SetupBranch[] = [];
  let branchesTotal = 0;
  try {
    if (id) initial = await getProductSetup(id);
    if (canManage && !details && (initial?.product.is_active ?? true)) {
      const page = await getProductBranchPage();
      branches = page.items;
      branchesTotal = page.total;
    } else if (hasPermission(user, "branches.read")) {
      branches = (await getBranchOptions()).filter((b) =>
        hasBranchScope(user, b.id),
      );
      branchesTotal = branches.length;
    } else {
      branches = (user.branch_ids ?? []).map((id) => ({
        id,
        name: "Assigned branch",
        status: "unknown",
      }));
      branchesTotal = branches.length;
    }
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) redirect("/");
    if (error instanceof ApiRequestError && [403, 404].includes(error.status))
      notFound();
    return (
      <AppPageShell user={user}>
        <OperationalLoadError
          title="product"
          description="Product details could not be loaded. Refresh to try again."
        />
      </AppPageShell>
    );
  }
  return (
    <AppPageShell user={user}>
      <ProductSetupWorkspace
        key={`${id ?? "new"}-${initial?.product.setup_revision}`}
        initial={initial}
        canManage={canManage && !details}
        canEdit={canManage && details}
        branches={branches}
        branchesTotal={branchesTotal}
      />
    </AppPageShell>
  );
}
