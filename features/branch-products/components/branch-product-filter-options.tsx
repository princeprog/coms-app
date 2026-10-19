import {
  ArrowDownAZ,
  ArrowDownWideNarrow,
  ArrowDownZA,
  ArrowUpWideNarrow,
  CircleCheck,
  CircleX,
  ListFilter,
  ShoppingBag,
  Utensils,
} from "lucide-react";

const sortColor = "text-violet-600! dark:text-violet-400!";

export const branchMenuAvailabilityOptions = [
  {
    value: "",
    label: "All availability",
    icon: <ListFilter className="text-primary!" />,
  },
  {
    value: "true",
    label: "Available",
    icon: <CircleCheck className="text-emerald-600! dark:text-emerald-400!" />,
  },
  {
    value: "false",
    label: "Unavailable",
    icon: <CircleX className="text-red-600! dark:text-red-400!" />,
  },
];

export const branchMenuServiceOptions = [
  {
    value: "",
    label: "All services",
    icon: <ListFilter className="text-primary!" />,
  },
  {
    value: "DINE_IN",
    label: "Dine-in",
    icon: <Utensils className="text-blue-600! dark:text-blue-400!" />,
  },
  {
    value: "TAKEAWAY",
    label: "Takeout",
    icon: <ShoppingBag className="text-amber-600! dark:text-amber-400!" />,
  },
];

export const branchMenuSortOptions = [
  {
    value: "product_name:asc",
    label: "Name A–Z",
    icon: <ArrowDownAZ className={sortColor} />,
  },
  {
    value: "product_name:desc",
    label: "Name Z–A",
    icon: <ArrowDownZA className={sortColor} />,
  },
  {
    value: "price:asc",
    label: "Lowest price",
    icon: <ArrowUpWideNarrow className={sortColor} />,
  },
  {
    value: "price:desc",
    label: "Highest price",
    icon: <ArrowDownWideNarrow className={sortColor} />,
  },
  {
    value: "created_at:desc",
    label: "Newest added",
    icon: <ArrowDownWideNarrow className={sortColor} />,
  },
  {
    value: "created_at:asc",
    label: "Oldest added",
    icon: <ArrowUpWideNarrow className={sortColor} />,
  },
];
