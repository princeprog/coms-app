import type { OfflineRecovery } from "../services/offline-types";
import { validateRecovery } from "../services/local-validation";

/** Full original-device export, including acknowledged envelopes. Never infer from a server page. */
export function recoveryEvidence(input: unknown, branchId: string) {
  const recovery = input as OfflineRecovery;
  validateRecovery(recovery);
  if (recovery.session.branch_id !== branchId)
    throw new Error("Choose the recovery file for this branch.");
  const records = [...recovery.records].sort(
    (a, b) => a.envelope.sequence - b.envelope.sequence,
  );
  if (
    !records.length ||
    records.length !== recovery.final_sequence ||
    records.some((record, index) => record.envelope.sequence !== index + 1)
  )
    throw new Error(
      "Use a complete original-device recovery export containing every sale, including confirmed sales. Empty or incomplete exports cannot finalize a register.",
    );
  if (recovery.cart.items.length)
    throw new Error(
      "The original device still has an unfinished order. Resolve that order and export again before recovery finalization.",
    );
  return {
    recovery,
    transactions: records.map((record) => record.envelope),
    final_sequence: recovery.final_sequence,
    transaction_ids: records.map((record) => record.envelope.id),
  };
}
