import type { ReactNode } from "react";
import {
  CalendarClock,
  History,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  ArrowDownAZ,
  ArrowDownZA,
} from "lucide-react";
import { receiptSortOptions } from "../services/supplier-receipt-page-params";

const icons: Record<string, ReactNode> = {
  newest: <CalendarClock className="text-blue-600! dark:text-blue-400!" />,
  oldest: <History className="text-blue-600! dark:text-blue-400!" />,
  cost_highest: (
    <ArrowDownWideNarrow className="text-emerald-600! dark:text-emerald-400!" />
  ),
  cost_lowest: (
    <ArrowUpWideNarrow className="text-emerald-600! dark:text-emerald-400!" />
  ),
  supplier_asc: (
    <ArrowDownAZ className="text-violet-600! dark:text-violet-400!" />
  ),
  supplier_desc: (
    <ArrowDownZA className="text-violet-600! dark:text-violet-400!" />
  ),
};
export const supplierReceiptSortOptions = receiptSortOptions.map((option) => ({
  ...option,
  icon: icons[option.value],
}));
