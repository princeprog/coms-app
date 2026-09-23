type DecimalParts = { coefficient: bigint; scale: number };

const decimalPattern = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;

export function addSaleDecimals(values: string[]): string {
  if (values.length === 0) return "0";
  const parts = values.map(parseDecimal);
  const scale = Math.max(...parts.map((value) => value.scale));
  const total = parts.reduce(
    (sum, value) => sum + value.coefficient * powerOfTen(scale - value.scale),
    BigInt(0),
  );
  return formatDecimal(total, scale);
}

export function multiplySaleDecimals(left: string, right: string): string {
  const leftParts = parseDecimal(left);
  const rightParts = parseDecimal(right);
  return formatDecimal(
    leftParts.coefficient * rightParts.coefficient,
    leftParts.scale + rightParts.scale,
  );
}

export function calculateSaleTotal(
  items: { quantity: string; unitPrice: string }[],
): string {
  return addSaleDecimals(
    items.map(({ quantity, unitPrice }) =>
      multiplySaleDecimals(quantity, unitPrice),
    ),
  );
}

function parseDecimal(value: string): DecimalParts {
  if (!decimalPattern.test(value))
    throw new TypeError("Expected a nonnegative decimal string.");
  const [whole, fraction = ""] = value.split(".");
  return {
    coefficient: BigInt(`${whole}${fraction}`),
    scale: fraction.length,
  };
}

function powerOfTen(scale: number): bigint {
  let value = BigInt(1);
  for (let index = 0; index < scale; index += 1) value *= BigInt(10);
  return value;
}

function formatDecimal(coefficient: bigint, scale: number): string {
  const padded = coefficient.toString().padStart(scale + 1, "0");
  if (scale === 0) return padded;
  const whole = padded.slice(0, -scale);
  const fraction = padded.slice(-scale).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}
