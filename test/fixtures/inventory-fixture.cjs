const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DECIMAL = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;

function uuid(prefix, sequence) {
  return `${prefix}-0000-4000-8000-${String(sequence).padStart(12, "0")}`;
}

function split(value) {
  const negative = value.startsWith("-");
  const [whole, fraction = ""] = value.replace(/^-/, "").split(".");
  return {
    digits: BigInt(whole + fraction) * (negative ? -1n : 1n),
    scale: fraction.length,
  };
}

function decimal(digits, scale) {
  const negative = digits < 0n;
  let value = String(negative ? -digits : digits).padStart(scale + 1, "0");
  if (scale > 0) {
    const point = value.length - scale;
    value = `${value.slice(0, point)}.${value.slice(point)}`;
    value = value.replace(/0+$/, "").replace(/\.$/, "");
  }
  return `${negative ? "-" : ""}${value}`;
}

function add(left, right) {
  const a = split(left);
  const b = split(right);
  const scale = Math.max(a.scale, b.scale);
  return decimal(
    a.digits * 10n ** BigInt(scale - a.scale) +
      b.digits * 10n ** BigInt(scale - b.scale),
    scale,
  );
}

function compare(left, right) {
  const a = split(left);
  const b = split(right);
  const scale = Math.max(a.scale, b.scale);
  const leftValue = a.digits * 10n ** BigInt(scale - a.scale);
  const rightValue = b.digits * 10n ** BigInt(scale - b.scale);
  return leftValue < rightValue ? -1 : leftValue > rightValue ? 1 : 0;
}

function pageItems(items, url) {
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("page_size")) || 25),
  );
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    page_size: pageSize,
  };
}

function movement({
  scope,
  branchId,
  stockItem,
  type,
  delta,
  actorId,
  index,
  reason = null,
  key = null,
}) {
  return {
    id: uuid(scope === "COMMISSARY" ? "71000000" : "72000000", index),
    inventory_scope: scope,
    branch_id: branchId,
    stock_item_id: stockItem.id,
    stock_item_name: stockItem.stock_item_name,
    unit: stockItem.unit,
    movement_type: type,
    quantity_delta: delta,
    reason,
    actor_user_id: actorId,
    idempotency_key: key,
    created_at: new Date(
      Date.parse("2026-09-25T01:00:00.000Z") + index * 30_000,
    ).toISOString(),
  };
}

function createInventorySeed({ branches, stockItems, seed }) {
  const balances = (branchId) =>
    stockItems.map((stockItem, index) => ({
      ...stockItem,
      quantity_on_hand: index === 2 ? "0" : `${20 + index}.25`,
      ...(branchId ? { branch_id: branchId } : {}),
    }));
  const commissaryBalances = balances(null);
  const branchBalances = branches.flatMap((branch) => balances(branch.id));
  const movementTypes = [
    "RECEIPT",
    "ADJUSTMENT",
    "DISPATCH",
    "TRANSFER_IN",
    "SALE",
    "SALE_VOID",
    "REPORT_ADJUSTMENT",
  ];
  const makeMovements = (scope, branchId, branchIndex = 0) =>
    stockItems.map((stockItem, index) =>
      movement({
        scope,
        branchId,
        stockItem,
        type: movementTypes[index % movementTypes.length],
        delta: index % 3 === 1 ? "-1.25" : `${index + 1}.5`,
        actorId: seed.user.id,
        index:
          index + (branchId ? 1000 + branchIndex * stockItems.length : 0) + 1,
        reason: index % 3 === 1 ? "Fixture ledger correction" : null,
        key: null,
      }),
    );
  return {
    commissaryBalances,
    branchBalances,
    commissaryMovements: makeMovements("COMMISSARY", null),
    branchMovements: branches.flatMap((branch, branchIndex) =>
      makeMovements("BRANCH", branch.id, branchIndex),
    ),
    inventoryActionKeys: [],
    inventoryAdjustmentSequence: 0,
  };
}

function handleInventoryRequest({ request, response, url, body, state, seed }) {
  const route = url.pathname.match(
    /^\/inventory\/(commissary|branches\/([0-9a-f-]{36}))(?:\/(movements|adjustments))?$/i,
  );
  if (!route) return false;
  const branchId = route[2] ?? null;
  const resource = route[3] ?? "balances";
  const scope = branchId ? "BRANCH" : "COMMISSARY";
  if (branchId && !state.branches.some((branch) => branch.id === branchId))
    return send(response, 404, { message: "Branch not found." });

  if (resource === "balances" && request.method === "GET") {
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const all = branchId
      ? state.branchBalances.filter((item) => item.branch_id === branchId)
      : state.commissaryBalances;
    const filtered = all.filter(
      (item) => !search || item.stock_item_name.toLowerCase().includes(search),
    );
    return send(response, 200, pageItems(filtered, url));
  }
  if (resource === "movements" && request.method === "GET") {
    const all = branchId
      ? state.branchMovements.filter((item) => item.branch_id === branchId)
      : state.commissaryMovements;
    return send(response, 200, pageItems(all, url));
  }
  if (resource !== "adjustments" || request.method !== "POST")
    return send(response, 405, { message: "Method not allowed." });

  const key = request.headers["idempotency-key"];
  if (
    !UUID.test(key ?? "") ||
    !UUID.test(body?.stock_item_id ?? "") ||
    !DECIMAL.test(body?.quantity_delta ?? "") ||
    !/[1-9]/.test(body.quantity_delta) ||
    typeof body?.reason !== "string" ||
    !body.reason.trim() ||
    body.reason.length > 500
  )
    return send(response, 400, {
      message: "Check the quantity and reason for this adjustment.",
    });
  const fingerprint = `${scope}:${branchId ?? ""}:${body.stock_item_id}:${body.quantity_delta}:${body.reason.trim()}`;
  const previous = state.inventoryActionKeys.find((entry) => entry.key === key);
  if (previous)
    return previous.fingerprint === fingerprint
      ? send(response, 201, { movement: previous.movement })
      : send(response, 409, { message: "Idempotency key conflict." });
  const balances = branchId ? state.branchBalances : state.commissaryBalances;
  const balance = balances.find(
    (item) =>
      item.id === body.stock_item_id &&
      (!branchId || item.branch_id === branchId),
  );
  if (!balance)
    return send(response, 404, { message: "Stock item not found." });
  const next = add(balance.quantity_on_hand, body.quantity_delta);
  if (compare(next, "0") < 0)
    return send(response, 409, {
      message: "Adjustment would make stock negative.",
    });
  balance.quantity_on_hand = next;
  const movementValue = movement({
    scope,
    branchId,
    stockItem: balance,
    type: "ADJUSTMENT",
    delta: body.quantity_delta,
    actorId: seed.user.id,
    index: 2000 + ++state.inventoryAdjustmentSequence,
    reason: body.reason.trim(),
    key,
  });
  const movements = branchId
    ? state.branchMovements
    : state.commissaryMovements;
  movements.unshift(movementValue);
  state.inventoryActionKeys.push({ key, fingerprint, movement: movementValue });
  return send(response, 201, { movement: movementValue });
}

function send(response, status, payload) {
  response.writeHead(status, {
    "cache-control": "no-store",
    "content-type": "application/json",
  });
  response.end(JSON.stringify(payload));
}

module.exports = { createInventorySeed, handleInventoryRequest };
