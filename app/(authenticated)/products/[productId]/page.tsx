import { ProductSetupPage } from "@/features/products/components/product-setup-page";
export default async function ProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  return <ProductSetupPage id={productId} details />;
}
