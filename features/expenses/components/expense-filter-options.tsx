import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Ban,
  CircleCheck,
  Layers,
  MapPin,
  Package,
  Receipt,
  ShoppingBasket,
  Store,
  Tag,
  TrendingDown,
  TrendingUp,
  Truck,
  Warehouse,
} from "lucide-react";
import type { ReactNode } from "react";
import type {
  ExpenseCategory,
  ExpenseLocation,
} from "../schemas/expense.schema";
import type { ExpenseQuery } from "../services/expense-query";

export type ExpenseFilterOption = {
  value: string;
  label: string;
  icon?: ReactNode;
};

export const expenseSortOptions: ExpenseFilterOption[] = [
  {
    value: "newest",
    label: "Newest first",
    icon: <ArrowDownWideNarrow className="text-violet-600" />,
  },
  {
    value: "oldest",
    label: "Oldest first",
    icon: <ArrowUpWideNarrow className="text-violet-600" />,
  },
  {
    value: "amount_highest",
    label: "Highest amount",
    icon: <TrendingUp className="text-emerald-600" />,
  },
  {
    value: "amount_lowest",
    label: "Lowest amount",
    icon: <TrendingDown className="text-amber-600" />,
  },
];

export const expenseStatusOptions: ExpenseFilterOption[] = [
  {
    value: "RECORDED",
    label: "Recorded",
    icon: <CircleCheck className="text-emerald-600" />,
  },
  { value: "VOIDED", label: "Voided", icon: <Ban className="text-red-600" /> },
  {
    value: "all",
    label: "All statuses",
    icon: <Layers className="text-slate-500" />,
  },
];

export const expenseSourceOptions: ExpenseFilterOption[] = [
  {
    value: "all",
    label: "All sources",
    icon: <Layers className="text-slate-500" />,
  },
  {
    value: "OPERATING",
    label: "Operating expense",
    icon: <Receipt className="text-sky-600" />,
  },
  {
    value: "SUPPLIER_DELIVERY",
    label: "Supplier delivery",
    icon: <Truck className="text-orange-600" />,
  },
  {
    value: "DIRECT_PURCHASE",
    label: "Direct purchase",
    icon: <ShoppingBasket className="text-teal-600" />,
  },
];

export function expenseLocationOptions(
  locations: ExpenseLocation[],
): ExpenseFilterOption[] {
  return [
    {
      value: "all",
      label: "All locations",
      icon: <MapPin className="text-slate-500" />,
    },
    {
      value: "BRANCH",
      label: "All branches",
      icon: <Store className="text-blue-600" />,
    },
    ...locations.map((item) => ({
      value: item.branch_id ?? item.scope,
      label: `${item.name}${item.is_active ? "" : " (inactive)"}`,
      icon:
        item.scope === "COMMISSARY" ? (
          <Warehouse className="text-orange-600" />
        ) : (
          <Store className="text-blue-600" />
        ),
    })),
  ];
}

export function expenseCategoryOptions(
  categories: ExpenseCategory[],
): ExpenseFilterOption[] {
  return [
    {
      value: "all",
      label: "All categories",
      icon: <Layers className="text-slate-500" />,
    },
    {
      value: "STOCK_PURCHASES",
      label: "Stock purchases",
      icon: <Package className="text-teal-600" />,
    },
    ...categories.map((item) => ({
      value: item.id,
      label: `${item.name}${item.is_active ? "" : " (inactive)"}`,
      icon: <Tag className="text-pink-600" />,
    })),
  ];
}

export function expenseLocationValue(
  query: Pick<ExpenseQuery, "scope" | "branch_id">,
) {
  return query.branch_id ?? query.scope ?? "all";
}

export function expenseLocationChange(
  value: string,
): Pick<ExpenseQuery, "scope" | "branch_id"> {
  return {
    scope:
      value === "all"
        ? undefined
        : value === "COMMISSARY"
          ? "COMMISSARY"
          : "BRANCH",
    branch_id: ["all", "COMMISSARY", "BRANCH"].includes(value)
      ? undefined
      : value,
  };
}
