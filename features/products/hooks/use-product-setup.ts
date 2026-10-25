"use client";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { z } from "zod";
import type { ServiceType } from "@/features/menus/schemas/menu.schema";
import {
  productSetupInputSchema,
  type ProductSetup,
} from "../schemas/product-setup.schema";
import { saveProductSetupAction } from "../services/product-setup-actions";
import type { CategoryChoice } from "@/features/product-categories/schemas/product-category.schema";
import { buildRecipePayload } from "../services/product-recipe-rules";
import { useProductRecipe } from "./use-product-recipe";
export function useProductSetup(initial: ProductSetup | null) {
  const router = useRouter();
  const [category, setCategoryValue] = useState<CategoryChoice | null>(
    initial
      ? {
          id: initial.product.category_id,
          name: initial.product.category_name,
          is_active: initial.product.category_is_active,
        }
      : null,
  );
  const [name, setName] = useState(initial?.product.product_name ?? "");
  const [price, setPrice] = useState(initial?.product.price ?? "");
  const [description, setDescription] = useState(
    initial?.product.description ?? "",
  );
  const [services, setServices] = useState<ServiceType[]>(
    initial?.product.service_types ?? ["DINE_IN", "TAKEAWAY"],
  );
  const [branchIds, setBranchIds] = useState(initial?.branch_ids ?? []);
  const recipe = useProductRecipe(initial?.recipe ?? []);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  function setCategory(value: CategoryChoice) {
    setCategoryValue(value);
    if (!value.is_active || !z.uuid().safeParse(value.id).success) return;
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.category_id;
      return next;
    });
    setError((current) =>
      current === "Select an active category before saving." ? "" : current,
    );
  }
  const state = JSON.stringify({
    categoryId: category?.id,
    name,
    price,
    description,
    services,
    branchIds: [...branchIds].sort(),
    recipe: recipe.snapshot,
  });
  const [baseline, setBaseline] = useState(state);
  const retry = useRef<{ body: string; key: string } | null>(null);
  const dirty = state !== baseline;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const mutation = useMutation({
    mutationFn: async () => {
      if (!category?.is_active) {
        setFieldErrors({ category_id: "Select an active category." });
        throw Error("Select an active category before saving.");
      }
      const recipePayload = buildRecipePayload(recipe.rows, services);
      if (Object.keys(recipePayload.errors).length) {
        recipe.setErrors(recipePayload.errors);
        throw Error("Check the highlighted recipe lines.");
      }
      const parsed = productSetupInputSchema.safeParse({
        expected_product_revision: initial?.product.setup_revision ?? 0,
        product: {
          category_id: category.id,
          product_name: name,
          price: price.trim(),
          description,
          service_types: services,
          branch_ids: [...branchIds].sort(),
        },
        recipe: recipePayload.lines,
      });
      if (!parsed.success) {
        setFieldErrors(
          Object.fromEntries(
            parsed.error.issues.map((issue) => [
              String(issue.path[1] ?? issue.path[0]),
              issue.message,
            ]),
          ),
        );
        throw Error("Check the highlighted product fields.");
      }
      const body = JSON.stringify(parsed.data);
      if (!retry.current || retry.current.body !== body)
        retry.current = { body, key: crypto.randomUUID() };
      const result = await saveProductSetupAction(
        initial?.product.id,
        parsed.data,
        retry.current.key,
      );
      if (!result.ok) throw Error(result.error);
      return result.data;
    },
    onMutate: () => {
      setError("");
      setFieldErrors({});
      recipe.setErrors({});
    },
    onError: (e) => setError(e.message),
    onSuccess: () => {
      setBaseline(state);
      toast.add({
        type: "success",
        title: initial ? "Product saved." : "Product created.",
      });
      if (initial) router.refresh();
      else router.replace("/products");
    },
  });
  return {
    category,
    setCategory,
    name,
    setName,
    price,
    setPrice,
    description,
    setDescription,
    services,
    setServices,
    branchIds,
    setBranchIds,
    recipe,
    error,
    fieldErrors,
    dirty,
    pending: mutation.isPending,
    save: () => mutation.mutate(),
  };
}
