import type { CreateSupplierReceipt } from "@/features/supplier-receipts/types/supplier-receipt.types";

type DecimalParts = { digits: string; scale: number };

function parseDecimal(value: string): DecimalParts {
  const [whole, fraction = ""] = value.split(".");
  return {
    digits: `${whole}${fraction}`.replace(/^0+(?=\d)/, ""),
    scale: fraction.length,
  };
}

function multiplyDigits(left: string, right: string) {
  const result = Array.from({ length: left.length + right.length }, () => 0);
  for (let leftIndex = left.length - 1; leftIndex >= 0; leftIndex--) {
    for (let rightIndex = right.length - 1; rightIndex >= 0; rightIndex--) {
      const resultIndex = leftIndex + rightIndex + 1;
      const product =
        Number(left[leftIndex]) * Number(right[rightIndex]) + result[resultIndex];
      result[resultIndex] = product % 10;
      result[resultIndex - 1] += Math.floor(product / 10);
    }
  }
  return result.join("").replace(/^0+(?=\d)/, "");
}

function addDigits(left: string, right: string) {
  let leftIndex = left.length - 1;
  let rightIndex = right.length - 1;
  let carry = 0;
  let result = "";
  while (leftIndex >= 0 || rightIndex >= 0 || carry) {
    const sum =
      (leftIndex >= 0 ? Number(left[leftIndex--]) : 0) +
      (rightIndex >= 0 ? Number(right[rightIndex--]) : 0) +
      carry;
    result = String(sum % 10) + result;
    carry = Math.floor(sum / 10);
  }
  return result.replace(/^0+(?=\d)/, "");
}

function formatDecimal({ digits: rawDigits, scale }: DecimalParts) {
  const digits = rawDigits.padStart(scale + 1, "0");
  const whole = scale ? digits.slice(0, -scale) : digits;
  const fraction = scale ? digits.slice(-scale).replace(/0+$/, "") : "";
  const normalizedWhole = whole.replace(/^0+(?=\d)/, "");
  return `${normalizedWhole}${fraction ? `.${fraction}` : ""}`;
}

export function calculateSupplierReceiptTotal(
  input: CreateSupplierReceipt,
) {
  const products = input.items.map((item) => {
    const quantity = parseDecimal(item.quantity_received);
    const cost = parseDecimal(item.unit_cost);
    return {
      digits: multiplyDigits(quantity.digits, cost.digits),
      scale: quantity.scale + cost.scale,
    };
  });
  const scale = Math.max(0, ...products.map((product) => product.scale));
  const total = products.reduce(
    (sum, product) =>
      addDigits(sum, product.digits + "0".repeat(scale - product.scale)),
    "0",
  );
  return formatDecimal({ digits: total, scale });
}
