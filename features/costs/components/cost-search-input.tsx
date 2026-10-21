"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

// Applies the search 350 ms after typing stops.
export function CostSearchInput({
  id,
  label,
  value,
  onSearch,
}: {
  id: string;
  label: string;
  value: string;
  onSearch: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    if (draft.trim() === value) return;
    const timer = setTimeout(() => onSearch(draft.trim()), 350);
    return () => clearTimeout(timer);
  }, [draft, value, onSearch]);
  return (
    <InputGroup className="h-11 sm:max-w-md">
      <InputGroupAddon>
        <Search aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput
        id={id}
        type="search"
        aria-label={label}
        placeholder={label}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
    </InputGroup>
  );
}
