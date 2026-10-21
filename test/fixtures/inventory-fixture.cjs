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

function subtract(left, right) {
  return add(left, right.startsWith("-") ? right.slice(1) : `-${right}`);
}

function levelFor(state, scope, branchId, stockItemId) {
  return state.stockLevels.find(
    (level) =>
      level.scope === scope &&
      level.branch_id === (branchId ?? null) &&
      level.stock_item_id === stockItemId,
  );
}

// Mirrors the API: status, levels and stock on the way for one balance row.
function withStockFields(state, scope, branchId, item) {
  const level = levelFor(state, scope, branchId, item.id);
  const onTheWay = "0";
  const reorder = level?.reorder_level ?? null;
  const position = add(item.quantity_on_hand, onTheWay);
  const stock_status = !item.is_active
    ? "INACTIVE"
    : compare(item.quantity_on_hand, "0") < 0
      ? "BELOW_ZERO"
      : compare(item.quantity_on_hand, "0") === 0
        ? "OUT_OF_STOCK"
        : reorder !== null && compare(position, reorder) <= 0
          ? "LOW"
          : "IN_STOCK";
  return {
    ...item,
    on_the_way: onTheWay,
    reorder_level: reorder,
    target_level: level?.target_level ?? null,
    avg_daily_use: "1.5",
    stock_status,
  };
}

function needsRestock(item) {
  return (
    item.is_active &&
    item.reorder_level !== null &&
    compare(add(item.quantity_on_hand, item.on_the_way), item.reorder_level) <=
      0
  );
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
    // Flour (first item) is low everywhere; the second item has room.
    stockLevels: [
      {
        scope: "COMMISSARY",
        branch_id: null,
        stock_item_id: stockItems[0].id,
        reorder_level: "25",
        target_level: "40",
      },
      ...branches.flatMap((branch) => [
        {
          scope: "BRANCH",
          branch_id: branch.id,
          stock_item_id: stockItems[0].id,
          reorder_level: "25",
          target_level: "40",
        },
        {
          scope: "BRANCH",
          branch_id: branch.id,
          stock_item_id: stockItems[1].id,
          reorder_level: "5",
          target_level: "30",
        },
      ]),
    ],
    commissaryMovements: makeMovements("COMMISSARY", null),
    branchMovements: branches.flatMap((branch, branchIndex) =>
      makeMovements("BRANCH", branch.id, branchIndex),
    ),
    inventoryActionKeys: [],
    inventoryAdjustmentSequence: 0,
  };
}

function handleInventoryRequest({ request, response, url, body, state, seed }) {
  if (url.pathname === "/inventory/levels" && request.method === "PUT")
    return setLevels({ response, body, state });
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
    const activeFilter = url.searchParams.get("is_active");
    const categoryFilter = (url.searchParams.get("category") ?? "").trim();
    const stockFilter = url.searchParams.get("stock");
    if (
      (activeFilter !== null &&
        activeFilter !== "true" &&
        activeFilter !== "false") ||
      search.length > 120 ||
      categoryFilter.length > 80 ||
      (stockFilter !== null && stockFilter !== "low")
    )
      return send(response, 400, { message: "Invalid inventory filters." });

    const all = (
      branchId
        ? state.branchBalances.filter((item) => item.branch_id === branchId)
        : state.commissaryBalances
    ).map((item) => withStockFields(state, scope, branchId, item));
    const filtered = all.filter((item) => {
      const matchesSearch =
        !search ||
        item.stock_item_name.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search);
      const matchesStatus =
        activeFilter === null || item.is_active === (activeFilter === "true");
      const matchesCategory =
        !categoryFilter || item.category === categoryFilter;
      const matchesStock = stockFilter !== "low" || needsRestock(item);
      return matchesSearch && matchesStatus && matchesCategory && matchesStock;
    });
    const availableCategories = [
      ...new Set(state.stockItems.map((item) => item.category)),
    ].sort((left, right) => left.localeCompare(right));
    return send(response, 200, {
      ...pageItems(filtered, url),
      available_categories: availableCategories,
    });
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

const LEVEL = /^(?:0|[1-9]\d{0,8})(?:\.\d{1,3})?$/;

function setLevels({ response, body, state }) {
  const clearing = body?.reorder_level === null && body?.target_level === null;
  const branchIds = body?.scope === "BRANCH" ? (body.branch_ids ?? []) : [null];
  if (
    !UUID.test(body?.stock_item_id ?? "") ||
    !["COMMISSARY", "BRANCH"].includes(body?.scope) ||
    !branchIds.length ||
    (!clearing &&
      (!LEVEL.test(body?.reorder_level ?? "") ||
        !LEVEL.test(body?.target_level ?? "") ||
        compare(body.target_level, body.reorder_level) <= 0))
  )
    return send(response, 400, {
      message: "Target level must be more than the reorder level",
    });
  for (const branchId of branchIds) {
    state.stockLevels = state.stockLevels.filter(
      (level) =>
        !(
          level.scope === body.scope &&
          level.branch_id === branchId &&
          level.stock_item_id === body.stock_item_id
        ),
    );
    if (!clearing)
      state.stockLevels.push({
        scope: body.scope,
        branch_id: branchId,
        stock_item_id: body.stock_item_id,
        reorder_level: body.reorder_level,
        target_level: body.target_level,
      });
  }
  return send(response, 200, {
    stock_item_id: body.stock_item_id,
    reorder_level: clearing ? null : body.reorder_level,
    target_level: clearing ? null : body.target_level,
    locations: branchIds.length,
    changed: branchIds.length,
  });
}

function handleRestockSuggestions({ request, response, url, state }) {
  if (
    url.pathname !== "/dispatches/restock-suggestions" ||
    request.method !== "GET"
  )
    return false;
  const branchId = url.searchParams.get("branch_id");
  if (!state.branches.some((branch) => branch.id === branchId))
    return send(response, 404, { message: "Active branch not found" });
  const items = state.branchBalances
    .filter((item) => item.branch_id === branchId)
    .map((item) => withStockFields(state, "BRANCH", branchId, item))
    .filter(needsRestock)
    .map((item) => {
      const available =
        state.commissaryBalances.find((stock) => stock.id === item.id)
          ?.quantity_on_hand ?? "0";
      const suggested = subtract(
        item.target_level,
        add(item.quantity_on_hand, item.on_the_way),
      );
      const capped = compare(suggested, available) <= 0 ? suggested : available;
      return {
        stock_item_id: item.id,
        stock_item_name: item.stock_item_name,
        unit: item.unit,
        on_hand: item.quantity_on_hand,
        on_the_way: item.on_the_way,
        reorder_level: item.reorder_level,
        target_level: item.target_level,
        suggested_quantity: suggested,
        quantity_to_send: compare(capped, "0") < 0 ? "0" : capped,
        commissary_available: available,
      };
    });
  return send(response, 200, { branch_id: branchId, items });
}

module.exports = {
  createInventorySeed,
  handleInventoryRequest,
  handleRestockSuggestions,
};
