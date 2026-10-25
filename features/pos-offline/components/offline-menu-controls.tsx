import { Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OfflineSnapshot } from "../services/offline-types";

export function OfflineMenuControls({
  snapshot,
  search,
  category,
  onSearch,
  onCategory,
}: {
  snapshot: OfflineSnapshot;
  search: string;
  category: string;
  onSearch: (value: string) => void;
  onCategory: (value: string) => void;
}) {
  const categories = [
    ...new Map(
      snapshot.products.map((product) => [
        product.category_id,
        product.category_name,
      ]),
    ).entries(),
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="offline-menu-search">Search prepared menu</Label>
        <Input
          id="offline-menu-search"
          type="search"
          className="h-11"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Product name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="offline-menu-category">Category</Label>
        <Select
          value={category}
          onValueChange={(value) => onCategory(value ?? "all")}
        >
          <SelectTrigger id="offline-menu-category" className="h-11 w-full">
            <SelectValue>
              {() =>
                category === "all"
                  ? "All categories"
                  : categories.find(([id]) => id === category)?.[1]
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value="all">
              <Tag className="text-slate-500" aria-hidden />
              All categories
            </SelectItem>
            {categories.map(([id, name]) => (
              <SelectItem value={id} key={id}>
                <Tag className="text-amber-600" aria-hidden />
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
