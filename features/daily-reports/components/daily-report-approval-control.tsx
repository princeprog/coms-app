import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function DailyReportApprovalControl({
  pending,
  disabled,
  onConfirm,
}: {
  pending: boolean;
  disabled: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button type="button" disabled={pending || disabled} />}
      >
        Approve report
      </AlertDialogTrigger>
      <AlertDialogContent data-coms-ui="operational">
        <AlertDialogHeader>
          <AlertDialogTitle>Approve this daily report?</AlertDialogTitle>
          <AlertDialogDescription>
            Approval reconciles the physical count to current branch stock and
            records the change in inventory history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Review later</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            disabled={pending || disabled}
            onClick={onConfirm}
          >
            {pending ? "Approving…" : "Approve and reconcile"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
