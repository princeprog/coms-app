"use client";
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { offlineBranchPath, offlineRequest } from "./offline-api";
import { recoveryEvidence } from "./recovery-evidence";
import { offlineErrorMessage } from "./offline-errors";
import { validateSync } from "../services/local-validation";
import type { OfflineSyncResponse } from "../services/offline-types";
import { toast } from "@/components/ui/toast";

export function useRegisterRecovery(branchId: string) {
  const [evidence, setEvidence] = useState<ReturnType<
    typeof recoveryEvidence
  > | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [result, setResult] = useState("");
  const busy = useRef(false);
  const client = useQueryClient();
  async function load(file: File | undefined) {
    setEvidence(null);
    setAcknowledged(false);
    setError("");
    setResult("");
    if (!file) return;
    try {
      if (file.size > 20 * 1024 * 1024)
        throw new Error("Recovery files must be smaller than 20 MB.");
      setEvidence(recoveryEvidence(JSON.parse(await file.text()), branchId));
    } catch (failure) {
      setError(
        failure instanceof Error && failure.name !== "OfflinePosError"
          ? failure.message
          : "This is not a valid complete COMS recovery file.",
      );
    }
  }
  async function run(finalize = false) {
    if (
      !evidence ||
      busy.current ||
      reason.trim().length < 3 ||
      (finalize && !acknowledged)
    )
      return false;
    busy.current = true;
    setPending(true);
    setError("");
    const { recovery, transactions, final_sequence, transaction_ids } =
      evidence;
    const path = `${offlineBranchPath(branchId)}/sessions/${recovery.session.id}`;
    try {
      if (finalize) {
        await offlineRequest(`${path}/recover-finalize`, "POST", {
          device_id: recovery.session.device_id,
          final_sequence,
          transaction_ids,
          reason: reason.trim(),
        });
        setResult(
          "Recovered register finalized. Original cashier and sale details are preserved.",
        );
        setEvidence(null);
        setAcknowledged(false);
        toast.add({ type: "success", title: "Recovered register finalized" });
      } else {
        const ackIds = new Set<string>();
        for (let index = 0; index < transactions.length; index += 25) {
          const batch = transactions.slice(index, index + 25);
          const response = await offlineRequest<OfflineSyncResponse>(
            `${path}/recover`,
            "POST",
            {
              device_id: recovery.session.device_id,
              transactions: batch,
              reason: reason.trim(),
            },
          );
          validateSync(response);
          for (const item of response.results)
            if (
              batch.some((envelope) => envelope.id === item.id) &&
              item.status === "ACKNOWLEDGED"
            )
              ackIds.add(item.id);
        }
        const all = ackIds.size === transactions.length;
        setAcknowledged(all);
        setResult(
          all
            ? `All ${transactions.length} exported sales are confirmed. Review and finalize the recovered register.`
            : `${ackIds.size} of ${transactions.length} exported sales confirmed. Review held sales below, then retry this recovery file.`,
        );
      }
      await client.invalidateQueries({ queryKey: ["pos-offline", branchId] });
      return true;
    } catch (failure) {
      setError(offlineErrorMessage(failure));
      return false;
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  return {
    evidence,
    reason,
    setReason,
    error,
    pending,
    acknowledged,
    result,
    load,
    run,
  };
}
