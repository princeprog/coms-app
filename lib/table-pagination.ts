export const tablePageSizes = [10, 30, 50] as const;

export function parseTablePageSize(value: string | string[] | undefined) {
  const size = Number(Array.isArray(value) ? value[0] : value);
  return tablePageSizes.find((option) => option === size) ?? 10;
}
