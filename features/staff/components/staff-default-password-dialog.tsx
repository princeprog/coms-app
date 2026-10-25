"use client";

import { useRef, useState, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StaffDefaultPasswordFields } from "./staff-default-password-fields";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { useDefaultPassword } from "../hooks/use-default-password";
import { StaffEditFormFooter } from "./staff-edit-form-footer";
import { StaffDiscardConfirmation } from "./staff-discard-confirmation";

export function StaffDefaultPasswordDialog({
  configured,
}: {
  configured: boolean | null;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <Button
        ref={triggerRef}
        variant="outline"
        className="h-10"
        onClick={() => setOpen(true)}
      >
        <KeyRound aria-hidden="true" /> Default password
      </Button>
      {open && (
        <DefaultPasswordForm
          configured={configured}
          triggerRef={triggerRef}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function DefaultPasswordForm({
  configured,
  triggerRef,
  onClose,
}: {
  configured: boolean | null;
  triggerRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>(
    {},
  );
  const [discard, setDiscard] = useState(false);
  const mutation = useDefaultPassword(() => {
    toast.add({
      type: "success",
      title: "Default password saved",
      description:
        "New staff will use this password and must change it at first sign-in.",
    });
    router.refresh();
    onClose();
  });
  function close() {
    if (mutation.isPending) return;
    if (password || confirm) setDiscard(true);
    else onClose();
  }
  return (
    <Dialog open onOpenChange={(next) => !next && close()}>
      <DialogContent
        data-coms-ui="operational"
        showCloseButton={false}
        finalFocus={triggerRef}
        overlayClassName="bg-black/45 supports-backdrop-filter:backdrop-blur-none"
        className="flex max-h-[90dvh] min-h-0 flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        <DialogHeader className="relative shrink-0 gap-2 px-5 pt-6 pb-5 sm:px-8 sm:pt-7">
          <DialogTitle className="pr-8 text-xl font-semibold">
            Default password
          </DialogTitle>
          <DialogDescription>
            Set the password for newly created staff accounts.
          </DialogDescription>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close default password"
            className="absolute top-5 right-5 sm:right-7"
            disabled={mutation.isPending}
            onClick={close}
          >
            <X />
          </Button>
        </DialogHeader>
        <form
          className="flex min-h-0 flex-col"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (mutation.isPending) return;
            const found = {
              password:
                password.length < 1 || password.length > 128
                  ? "Use 1 to 128 characters."
                  : undefined,
              confirm:
                confirm !== password ? "The passwords don't match." : undefined,
            };
            setErrors(found);
            const first = found.password
              ? "password"
              : found.confirm
                ? "confirm"
                : null;
            if (first) {
              document.getElementById(`default-${first}`)?.focus();
              return;
            }
            mutation.mutate(password);
          }}
        >
          <div className="space-y-5 overflow-y-auto px-5 pb-6 sm:px-8">
            <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              {configured === false && (
                <p className="mb-1 font-medium text-foreground">
                  Set up before adding staff.
                </p>
              )}
              Existing accounts keep their passwords. New staff must choose
              their own password before accessing COMS. Share the default with
              them privately.
            </div>
            <StaffDefaultPasswordFields
              password={password}
              confirm={confirm}
              errors={errors}
              pending={mutation.isPending}
              onChange={(field, value) => {
                if (field === "password") setPassword(value);
                else setConfirm(value);
                setErrors({});
                mutation.reset();
              }}
            />
            {mutation.error && (
              <p role="alert" className="text-sm text-destructive">
                {mutation.error.message}
              </p>
            )}
          </div>
          <StaffEditFormFooter
            pending={mutation.isPending}
            disabled={!password || !confirm}
            label="Save default password"
            pendingLabel="Saving…"
            onCancel={close}
          />
        </form>
      </DialogContent>
      <StaffDiscardConfirmation
        open={discard}
        onOpenChange={setDiscard}
        onDiscard={onClose}
      />
    </Dialog>
  );
}
