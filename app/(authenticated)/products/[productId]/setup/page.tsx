import { ProductSetupPage } from "@/features/products/components/product-setup-page";
export default async function SetupPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  return <ProductSetupPage id={productId} />;
}
