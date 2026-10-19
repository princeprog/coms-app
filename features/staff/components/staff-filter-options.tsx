import { CircleCheck, CircleX, ListFilter, UserRoundMinus } from "lucide-react";
export const staffStatusOptions = [
  {
    value: "all",
    label: "All staff",
    icon: <ListFilter className="text-primary!" />,
  },
  {
    value: "active",
    label: "Active",
    icon: <CircleCheck className="text-emerald-600! dark:text-emerald-400!" />,
  },
  {
    value: "inactive",
    label: "Inactive",
    icon: <CircleX className="text-red-600! dark:text-red-400!" />,
  },
  {
    value: "unassigned",
    label: "Unassigned",
    icon: <UserRoundMinus className="text-amber-600! dark:text-amber-400!" />,
  },
];
