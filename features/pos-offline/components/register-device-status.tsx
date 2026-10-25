import { Badge } from "@/components/ui/badge";
import type { OwnRegisterDevice } from "../hooks/use-register-device-status";

const states = {
  NONE: {
    label: "Not registered",
    color: "bg-slate-700",
    text: "Register this browser, then ask a manager to approve it.",
  },
  PENDING: {
    label: "Waiting for approval",
    color: "bg-amber-700",
    text: "A manager approves this browser from Branches → Offline registers.",
  },
  APPROVED: {
    label: "Approved",
    color: "bg-green-700",
    text: "Prepare this register while your shift is open.",
  },
  REVOKED: {
    label: "Approval revoked",
    color: "bg-red-700",
    text: "Ask a manager to approve this browser again.",
  },
} as const;

export function RegisterDeviceStatus({
  device,
}: {
  device: OwnRegisterDevice | null;
}) {
  const state = states[device?.status ?? "NONE"];
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-medium">Offline cash register</h2>
        <Badge className={`${state.color} text-white`}>{state.label}</Badge>
        {device && (
          <span className="text-sm text-muted-foreground">{device.name}</span>
        )}
      </div>
      <p className="text-sm text-muted-foreground">{state.text}</p>
    </div>
  );
}
