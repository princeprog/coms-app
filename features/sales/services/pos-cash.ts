import { subtractSaleDecimals } from "./sale-decimal";

export function calculateCashChange(received: string, total: string | null) {
  if (
    total === null ||
    !/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(received) ||
    received.length > 60
  )
    return { change: null, shortfall: null };
  const change = subtractSaleDecimals(received, total);
  return {
    change,
    shortfall: change === null ? subtractSaleDecimals(total, received) : null,
  };
}
