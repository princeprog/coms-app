export const expenseEndpoints = {
  list: "/expenses",
  locations: "/expenses/locations",
  categories: "/expenses/categories",
  cashOuts: "/expenses/cash-outs",
  detail: (source: string, id: string) => `/expenses/records/${source}/${id}`,
  record: (id: string) => `/expenses/${id}`,
  void: (id: string) => `/expenses/${id}/void`,
};
