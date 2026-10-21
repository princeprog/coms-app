import {
  Building2,
  CalendarClock,
  CreditCard,
  Factory,
  Folder,
  Layers,
  Package,
  ShieldCheck,
  Tags,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { auditAreaValues, type AuditArea } from "../schemas/audit.schema";
import { auditAreaLabels } from "../services/audit-format";

const areaIcons: Record<AuditArea, ReactNode> = {
  product: <Package className="text-orange-600!" />,
  product_category: <Folder className="text-amber-600!" />,
  stock_item: <Tags className="text-emerald-600!" />,
  supplier: <Factory className="text-sky-600!" />,
  branch: <Building2 className="text-indigo-600!" />,
  payment_method: <CreditCard className="text-teal-600!" />,
  business_day: <CalendarClock className="text-violet-600!" />,
  staff: <Users className="text-blue-600!" />,
  role: <ShieldCheck className="text-rose-600!" />,
};

export const auditAreaOptions = [
  {
    value: "all",
    label: "All areas",
    icon: <Layers className="text-primary!" />,
  },
  ...auditAreaValues.map((area) => ({
    value: area,
    label: auditAreaLabels[area],
    icon: areaIcons[area],
  })),
];
