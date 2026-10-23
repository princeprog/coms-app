/** Last week is up when it beats the average of the earlier weeks. */
export function risingLastWeek(values: number[]) {
  if (values.length < 2) return false;
  const last = values[values.length - 1];
  const earlier = values.slice(0, -1);
  const average =
    earlier.reduce((sum, value) => sum + value, 0) / earlier.length;
  return last > 0 && last > average;
}

export function sumValues(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0);
}

/** Sum of 2-decimal money strings in whole centavos, avoiding float drift. */
export function sumMoney(values: string[]) {
  const cents = values.reduce(
    (sum, value) => sum + Math.round(Number(value) * 100),
    0,
  );
  const absolute = Math.abs(cents);
  const fraction = String(absolute % 100).padStart(2, "0");
  return `${cents < 0 ? "-" : ""}${Math.floor(absolute / 100)}.${fraction}`;
}

/** Frequent when at least 3 shifts and 30% of them came up short. */
export function frequentShortages(shortShifts: number, shifts: number) {
  return shortShifts >= 3 && shifts > 0 && shortShifts / shifts >= 0.3;
}
