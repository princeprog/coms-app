import type { ShiftDetail } from "../schemas/shift.schema";
import { shiftDateTime } from "../services/shift-time";

export function ShiftNotes({ shift }: { shift: ShiftDetail }) {
  const notes = [
    shift.force_close_reason && {
      label: `Force closed by ${shift.closed_by_name ?? "a manager"}`,
      text: shift.force_close_reason,
    },
    shift.cashier_explanation && {
      label: `Explanation from ${shift.opened_by_name}`,
      text: shift.cashier_explanation,
    },
    shift.reviewed_at && {
      label: `Reviewed by ${shift.reviewed_by_name ?? "a manager"} · ${shiftDateTime(shift.reviewed_at)}`,
      text: shift.review_note ?? "No note",
    },
  ].filter((note): note is { label: string; text: string } => Boolean(note));
  if (!notes.length) return null;
  return (
    <section
      aria-label="Notes"
      className="flex flex-col gap-3 rounded-xl border bg-card p-5"
    >
      {notes.map((note) => (
        <div key={note.label}>
          <p className="text-xs font-medium text-muted-foreground">
            {note.label}
          </p>
          <p className="mt-1 text-sm whitespace-pre-wrap wrap-anywhere">
            {note.text}
          </p>
        </div>
      ))}
    </section>
  );
}
