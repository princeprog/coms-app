import { Checkbox } from "@/components/ui/checkbox";
export function CatalogChoiceField({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const selected = value ? value.split(",") : [];
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-5">
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={selected.includes(option.value)}
              disabled={disabled}
              onCheckedChange={(checked) =>
                onChange(
                  (checked
                    ? [...selected, option.value]
                    : selected.filter((item) => item !== option.value)
                  ).join(","),
                )
              }
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
