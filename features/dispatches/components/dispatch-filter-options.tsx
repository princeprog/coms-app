import {
  ArrowDownAZ,
  ArrowDownZA,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  CircleAlert,
  CircleCheck,
  ClipboardList,
  FilePenLine,
  ListChecks,
  ListFilter,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { dispatchStatuses } from "../constants";
import { dispatchSortOptions } from "../services/dispatch-page-params";
import { dispatchStatusLabel } from "./dispatch-status-badge";

const statusIcons = {
  DRAFT: FilePenLine,
  IN_TRANSIT: ClipboardList,
  PARTIALLY_RECEIVED: TriangleAlert,
  RECEIVED: PackageCheck,
  CLOSED_WITH_SHORTAGE: ListChecks,
};

const iconColors = {
  neutral: "text-slate-500! dark:text-slate-400!",
  info: "text-blue-600! dark:text-blue-400!",
  warning: "text-amber-600! dark:text-amber-400!",
  success: "text-emerald-600! dark:text-emerald-400!",
  danger: "text-red-600! dark:text-red-400!",
  sort: "text-violet-600! dark:text-violet-400!",
};

const statusColors = {
  DRAFT: iconColors.neutral,
  IN_TRANSIT: iconColors.info,
  PARTIALLY_RECEIVED: iconColors.warning,
  RECEIVED: iconColors.success,
  CLOSED_WITH_SHORTAGE: iconColors.danger,
};

export const dispatchStatusOptions = [
  {
    value: "all",
    label: "Dispatch status",
    icon: <ListFilter className="text-primary!" />,
  },
  ...dispatchStatuses.map((value) => {
    const Icon = statusIcons[value];
    return {
      value,
      label: dispatchStatusLabel(value),
      icon: <Icon className={statusColors[value]} />,
    };
  }),
];

export const dispatchDiscrepancyOptions = [
  {
    value: "all",
    label: "Discrepancy",
    icon: <ListFilter className="text-primary!" />,
  },
  {
    value: "NONE",
    label: "No discrepancy",
    icon: <ShieldCheck className={iconColors.success} />,
  },
  {
    value: "OPEN",
    label: "Open",
    icon: <CircleAlert className={iconColors.danger} />,
  },
  {
    value: "RECOUNT_REQUESTED",
    label: "Recount requested",
    icon: <RotateCcw className={iconColors.warning} />,
  },
  {
    value: "RESOLVED",
    label: "Resolved",
    icon: <CircleCheck className={iconColors.success} />,
  },
];

const sortIcons = {
  newest: ArrowDownWideNarrow,
  oldest: ArrowUpWideNarrow,
  branch_asc: ArrowDownAZ,
  branch_desc: ArrowDownZA,
};

export const dispatchSortOptionsWithIcons = dispatchSortOptions.map(
  (option) => {
    const Icon = sortIcons[option.value as keyof typeof sortIcons];
    return { ...option, icon: <Icon className={iconColors.sort} /> };
  },
);
