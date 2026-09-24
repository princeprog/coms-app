export function DailyReportMetric({
  label,
  value,
  unit,
}: {
  label: string;
  value: string | null;
  unit?: string;
}) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">
        {value === null ? "Not counted" : `${value}${unit ? ` ${unit}` : ""}`}
      </dd>
    </div>
  );
}
