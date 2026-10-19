"use client";
import { useRef, useState } from "react";
import { Archive, Ellipsis, RotateCcw, SquarePen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import type { ProductCategory } from "../schemas/product-category.schema";
import { useCategoryStatus } from "../hooks/use-category-mutations";

export function CategoryRowActions({
  category,
  onEdit,
}: {
  category: ProductCategory;
  onEdit: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const action = category.is_active ? "Archive" : "Reactivate";
  const mutation = useCategoryStatus(() => {
    toast.success(
      category.is_active ? "Category archived." : "Category reactivated.",
    );
    setConfirming(false);
    trigger.current?.focus();
  });
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              ref={trigger}
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`More actions for ${category.name}`}
            />
          }
        >
          <Ellipsis aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" data-coms-ui="operational">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={onEdit}>
              <SquarePen className="stroke-amber-600" aria-hidden="true" />
              Edit
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              variant={category.is_active ? "destructive" : "default"}
              onClick={() => {
                mutation.reset();
                setConfirming(true);
              }}
            >
              {category.is_active ? (
                <Archive aria-hidden="true" />
              ) : (
                <RotateCcw className="stroke-emerald-600" aria-hidden="true" />
              )}
              {action}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog
        open={confirming}
        onOpenChange={(open) => {
          if (!mutation.isPending) setConfirming(open);
        }}
      >
        <AlertDialogContent data-coms-ui="operational">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {action} {category.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {category.is_active
                ? "Archived categories cannot be selected for products. Move any active products to another category first. Existing records keep their category."
                : "This category will be available for product selection again."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {mutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {mutation.error.message}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              variant={category.is_active ? "destructive" : "default"}
              disabled={mutation.isPending}
              onClick={() =>
                mutation.mutate({
                  id: category.id,
                  active: !category.is_active,
                })
              }
            >
              {mutation.isPending ? "Saving…" : `${action} category`}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
