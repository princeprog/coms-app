export const branchProductsRoute = "/branch-products";

export function branchProductsEndpoint(branchId: string) {
  return `/branches/${branchId}/products`;
}
