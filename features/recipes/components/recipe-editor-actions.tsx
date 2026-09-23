import { Button } from "@/components/ui/button";

export function RecipeEditorActions({
  canEdit,
  pending,
  ingredientCount,
  onAddIngredient,
}: {
  canEdit: boolean;
  pending: boolean;
  ingredientCount: number;
  onAddIngredient: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={!canEdit || pending || ingredientCount >= 100}
        onClick={onAddIngredient}
      >
        Add ingredient
      </Button>
      <Button type="submit" disabled={!canEdit || pending}>
        {pending ? "Saving…" : "Save recipe"}
      </Button>
    </div>
  );
}
