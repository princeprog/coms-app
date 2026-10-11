import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function ProductSetupFooter({
  pending,
  dirty,
  isNew,
}: {
  pending: boolean;
  dirty: boolean;
  isNew: boolean;
}) {
  return (
    <>
      <Separator />
      <footer className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {dirty
            ? "Unsaved changes"
            : isNew
              ? ""
              : "Price changes apply to future sales."}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="lg"
            className="h-10 px-4"
            nativeButton={false}
            render={<Link href="/products" />}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="lg"
            className="h-10 px-4"
            disabled={pending}
          >
            {pending ? "Saving…" : isNew ? "Create product" : "Save product"}
          </Button>
        </div>
      </footer>
    </>
  );
}
