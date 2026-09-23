import "server-only";

import { z } from "zod";
import { hasBranchScope, hasPermission } from "@/features/auth/permissions";
import type { User } from "@/features/auth/types/auth.types";
import type {
  Dispatch,
  DispatchPage,
} from "@/features/dispatches/types/dispatch.types";
import { ApiRequestError } from "@/services/api-services";
import {
  createDispatchHref,
  parseDispatchPageFilters,
  type DispatchPageSearchParams,
} from "./dispatch-page-params";
import { getDispatchDetail, getDispatchPageData } from "./dispatch-queries";

export type DispatchIndexViewResult =
  | { status: "forbidden" }
  | { status: "session-expired" }
  | { status: "list-error" }
  | { status: "redirect"; href: string }
  | {
      status: "ready";
      page: DispatchPage;
      filters: ReturnType<typeof parseDispatchPageFilters>;
      canCreate: boolean;
    };

export type DispatchDetailViewResult =
  | { status: "forbidden" }
  | { status: "session-expired" }
  | { status: "not-found" }
  | { status: "detail-error" }
  | {
      status: "ready";
      dispatch: Dispatch;
      canDispatch: boolean;
      canReceive: boolean;
      canCloseShortage: boolean;
    };

function getAccessFailure(
  error: unknown,
): { status: "forbidden" } | { status: "session-expired" } | null {
  if (!(error instanceof ApiRequestError)) return null;
  if (error.status === 401) return { status: "session-expired" };
  if (error.status === 403) return { status: "forbidden" };
  return null;
}

export async function loadDispatchIndexView(
  user: User,
  searchParams: DispatchPageSearchParams,
): Promise<DispatchIndexViewResult> {
  if (!hasPermission(user, "dispatches.read")) return { status: "forbidden" };

  const filters = parseDispatchPageFilters(searchParams);
  let page: DispatchPage;
  try {
    page = await getDispatchPageData(filters);
  } catch (error) {
    const accessFailure = getAccessFailure(error);
    if (accessFailure) return accessFailure;
    return { status: "list-error" };
  }

  const pageCount = Math.max(1, Math.ceil(page.total / page.page_size));
  if (filters.page > pageCount)
    return {
      status: "redirect",
      href: createDispatchHref({ ...filters, page: pageCount }),
    };

  return {
    status: "ready",
    page,
    filters,
    canCreate: hasPermission(user, "dispatches.create"),
  };
}

export async function loadDispatchDetailView(
  user: User,
  id: string,
): Promise<DispatchDetailViewResult> {
  if (!hasPermission(user, "dispatches.read")) return { status: "forbidden" };
  if (!z.uuid().safeParse(id).success) return { status: "not-found" };

  try {
    const dispatch = await getDispatchDetail(id);
    if (!hasBranchScope(user, dispatch.branch_id))
      return { status: "forbidden" };

    const canReceiveStatus =
      dispatch.status === "IN_TRANSIT" ||
      dispatch.status === "PARTIALLY_RECEIVED";
    return {
      status: "ready",
      dispatch,
      canDispatch:
        dispatch.status === "DRAFT" &&
        hasPermission(user, "dispatches.dispatch"),
      canReceive: canReceiveStatus && hasPermission(user, "dispatches.receive"),
      canCloseShortage:
        canReceiveStatus && hasPermission(user, "dispatches.shortage_close"),
    };
  } catch (error) {
    const accessFailure = getAccessFailure(error);
    if (accessFailure) return accessFailure;
    if (error instanceof ApiRequestError && error.status === 404)
      return { status: "not-found" };
    return { status: "detail-error" };
  }
}
