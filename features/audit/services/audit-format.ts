import type { AuditArea, AuditEvent } from "../schemas/audit.schema";

export const auditAreaLabels: Record<AuditArea, string> = {
  product: "Products",
  product_category: "Product categories",
  stock_item: "Stock items",
  supplier: "Suppliers",
  branch: "Branches",
  payment_method: "Payment methods",
  business_day: "Business day",
  staff: "Staff",
  role: "Roles",
  export: "Exports",
};

const recordNouns: Record<string, string> = {
  product: "product",
  product_category: "product category",
  stock_item: "stock item",
  supplier: "supplier",
  branch: "branch",
  payment_method: "payment method",
  business_day: "business day rule",
  staff: "staff account",
  role: "role",
  export: "export",
};

const namedActions: Record<string, string> = {
  "auth.signed_in": "Signed in",
  "auth.sign_in_failed": "Failed sign-in",
  "auth.password_changed": "Changed password",
  "staff.password_reset": "Reset password",
  "staff.default_password_updated": "Updated staff default password",
  "staff.branches_updated": "Changed branch access",
  "role.permissions_updated": "Changed permissions",
  "stock_item.cost_set": "Set stock cost",
  "product.recipe_updated": "Changed recipe",
  "product.availability_updated": "Changed branch availability",
  "export.downloaded": "Downloaded CSV export",
};

const fieldLabels: Record<string, string> = {
  product_name: "Name",
  stock_item_name: "Name",
  supplier_name: "Name",
  branch_name: "Name",
  role_name: "Name",
  full_name: "Name",
  category_id: "Category",
  role_id: "Role",
  is_active: "Active",
  is_predefined: "Predefined",
  is_system: "System role",
  usage_types: "Recipe use",
  service_types: "Service types",
  preparation_type: "Preparation",
  has_dine_in: "Dine in",
  has_takeaway: "Takeout",
  date_opened: "Date opened",
  effective_from: "Effective from",
  start_time: "Day starts at",
  average_unit_cost: "Average cost",
};

const hiddenFields = new Set(["id", "created_by_user_id"]);
const moneyFields = new Set(["price", "average_unit_cost"]);
const MANILA = "Asia/Manila";

export function humanize(value: string) {
  const words = value.replace(/[._]+/g, " ").trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function fieldLabel(field: string) {
  return fieldLabels[field] ?? humanize(field.replace(/_id$/, ""));
}

export function visibleChanges(event: AuditEvent) {
  return Object.entries(event.changes).filter(
    ([field]) => !hiddenFields.has(field),
  );
}

// Keeps cents and any meaningful sub-centavo digits, e.g. ₱95.00 or ₱0.0125.
function formatMoney(value: string) {
  const [whole, fraction = ""] = value.split(".");
  const digits = fraction.replace(/0+$/, "").padEnd(2, "0");
  return `₱${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${digits}`;
}

export function formatFieldValue(field: string, value: unknown) {
  if (
    moneyFields.has(field) &&
    typeof value === "string" &&
    /^\d+(\.\d+)?$/.test(value)
  )
    return formatMoney(value);
  return formatAuditValue(value);
}

export function describeAction(event: AuditEvent) {
  const named = namedActions[event.action];
  if (named) return named;
  const noun = recordNouns[event.entity_type] ?? humanize(event.entity_type);
  const verb = event.action.split(".").pop();
  if (verb === "created") return `Created ${noun}`;
  if (verb === "deleted") return `Deleted ${noun}`;
  const changes = visibleChanges(event);
  const active = event.changes.is_active;
  if (changes.length === 1 && active)
    return `${active.to ? "Reactivated" : "Deactivated"} ${noun}`;
  if (verb === "updated") return `Updated ${noun}`;
  return humanize(event.action);
}

export function changeSummary(event: AuditEvent) {
  if (event.action.endsWith(".created") || event.action.endsWith(".deleted"))
    return "";
  const labels = [
    ...new Set(visibleChanges(event).map(([f]) => fieldLabel(f))),
  ];
  if (labels.length > 3)
    return `${labels.slice(0, 3).join(", ")} and ${labels.length - 3} more`;
  return labels.join(", ");
}

const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const enumPattern = /^[A-Z][A-Z0-9_]*$/;

export function formatAuditValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value))
    return value.length ? value.map(formatAuditValue).join(", ") : "None";
  if (typeof value === "string") {
    if (timestampPattern.test(value)) return formatAuditTime(value);
    if (enumPattern.test(value)) return humanize(value);
    return value;
  }
  if (typeof value === "number") return String(value);
  return JSON.stringify(value);
}

export function formatAuditTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: MANILA,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

const metadataLabels: Record<string, string> = {
  added: "Added",
  removed: "Removed",
  granted: "Granted",
  revoked: "Revoked",
  reason: "Reason",
  email: "Email used",
  file: "File",
  rows: "Rows",
  filters: "Filters",
};

function permissionLabel(key: string) {
  const [module, action] = key.split(".");
  return action
    ? `${humanize(module)}: ${humanize(action).toLowerCase()}`
    : key;
}

export function metadataEntries(event: AuditEvent) {
  return Object.entries(event.metadata).flatMap(([key, value]) => {
    const label = metadataLabels[key] ?? humanize(key);
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const items = Object.entries(value).map(
        ([name, item]) => `${fieldLabel(name)}: ${formatAuditValue(item)}`,
      );
      return [{ key, label, items: items.length ? items : ["None"] }];
    }
    if (Array.isArray(value)) {
      if (!value.length) return [];
      const items = value.map((item) =>
        event.action === "role.permissions_updated"
          ? permissionLabel(String(item))
          : formatAuditValue(item),
      );
      return [{ key, label, items }];
    }
    return [{ key, label, items: [formatAuditValue(value)] }];
  });
}
