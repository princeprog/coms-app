"use client";

import { useId, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DirectorySelect } from "./directory-select";
import { tablePageSizes } from "@/lib/table-pagination";

export function TablePageSize({
  pageSize,
  href,
}: {
  pageSize: number;
  href: string;
}) {
  const id = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div
      className="flex shrink-0 items-center gap-2 whitespace-nowrap text-sm text-muted-foreground"
      aria-busy={pending}
    >
      <span>Rows per page</span>
      <DirectorySelect
        id={id}
        label="Rows per page"
        hideLabel
        alignItemWithTrigger={false}
        className="w-20 sm:w-20 [&_[data-slot=select-trigger]]:h-10"
        value={String(pageSize)}
        options={tablePageSizes.map((size) => ({
          value: String(size),
          label: String(size),
        }))}
        onChange={(value) => {
          if (Number(value) === pageSize) return;
          const [path, query] = href.split("?");
          const params = new URLSearchParams(query);
          params.delete("page");
          params.set("page_size", value);
          startTransition(() =>
            router.replace(`${path}?${params}`, { scroll: false }),
          );
        }}
      />
      {pending && (
        <span role="status" className="sr-only">
          Updating rows…
        </span>
      )}
    </div>
  );
}
