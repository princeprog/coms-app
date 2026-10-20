import type { ShiftDetail } from "../schemas/shift.schema";

export type PosShiftState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "none" }
  | { kind: "own"; shift: ShiftDetail; dayEnded: boolean }
  | { kind: "other"; shift: ShiftDetail };

export function posShiftState(input: {
  userId: string;
  pending: boolean;
  error: Error | null;
  shift: ShiftDetail | null | undefined;
}): PosShiftState {
  if (input.pending) return { kind: "loading" };
  if (input.error) return { kind: "error", message: input.error.message };
  if (!input.shift) return { kind: "none" };
  if (input.shift.opened_by_user_id !== input.userId)
    return { kind: "other", shift: input.shift };
  return {
    kind: "own",
    shift: input.shift,
    dayEnded: input.shift.business_day_ended,
  };
}

/** Why checkout is unavailable, or null when the cashier may sell. */
export function sellBlockedReason(state: PosShiftState) {
  switch (state.kind) {
    case "loading":
      return "Checking your shift…";
    case "error":
      return "Shift status is unavailable. Retry before selling.";
    case "none":
      return "Open a shift to start selling.";
    case "other":
      return `${state.shift.opened_by_name}'s shift is open. Only they can sell until it closes.`;
    case "own":
      return state.dayEnded
        ? "The business day has ended. Close this shift to keep selling."
        : null;
  }
}
