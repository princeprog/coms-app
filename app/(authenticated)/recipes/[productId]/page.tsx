import { redirect } from "next/navigation";
export default async function RecipePage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  redirect(`/products/${productId}`);
}
