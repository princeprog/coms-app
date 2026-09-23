export const recipesRoute = "/recipes";

export function productRecipeEndpoint(productId: string) {
  return `/products/${productId}/recipe`;
}
