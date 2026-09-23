const decimalQuantityPattern = /^\d+(?:\.\d+)?$/;

export function isPositiveDecimalQuantity(quantity: string): boolean {
  return decimalQuantityPattern.test(quantity) && /[1-9]/.test(quantity);
}

export function isDecimalQuantityWithinLimit(
  quantity: string,
  limit: string,
): boolean {
  if (
    !decimalQuantityPattern.test(quantity) ||
    !decimalQuantityPattern.test(limit)
  ) {
    return false;
  }

  const [quantityWhole, quantityFraction = ""] = quantity.split(".");
  const [limitWhole, limitFraction = ""] = limit.split(".");
  const scale = Math.max(quantityFraction.length, limitFraction.length);
  const quantityValue = BigInt(
    `${quantityWhole}${quantityFraction.padEnd(scale, "0")}`,
  );
  const limitValue = BigInt(`${limitWhole}${limitFraction.padEnd(scale, "0")}`);

  return quantityValue <= limitValue;
}
