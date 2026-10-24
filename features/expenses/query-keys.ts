export const expenseKeys = {
  all: ["expenses"] as const,
  list: (query: unknown) => ["expenses", "list", query] as const,
  detail: (source: string, id: string) =>
    ["expenses", "detail", source, id] as const,
  categories: ["expenses", "categories"] as const,
  locations: ["expenses", "locations"] as const,
  cashOuts: (query: unknown) => ["expenses", "cash-outs", query] as const,
};
