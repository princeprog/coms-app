const DECIMAL_PATTERN = /^\d+(?:\.\d+)?$/;
const DISPATCH_STATUSES = [
  "DRAFT",
  "IN_TRANSIT",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
  "CLOSED_WITH_SHORTAGE",
];

function decimalParts(value) {
  const [whole, fraction = ""] = String(value).split(".");
  return { digits: BigInt(whole + fraction), scale: fraction.length };
}

function decimalText(digits, scale) {
  const negative = digits < 0n;
  let value = String(negative ? -digits : digits).padStart(scale + 1, "0");
  if (scale > 0) {
    const split = value.length - scale;
    value = value.slice(0, split) + "." + value.slice(split);
    value = value.replace(/0+$/, "").replace(/\.$/, "");
  }
  return (negative ? "-" : "") + value;
}

function decimalSum(values) {
  const parts = values.map(decimalParts);
  const scale = Math.max(0, ...parts.map((part) => part.scale));
  const total = parts.reduce(
    (sum, part) => sum + part.digits * 10n ** BigInt(scale - part.scale),
    0n,
  );
  return decimalText(total, scale);
}

function decimalSubtract(left, right) {
  const a = decimalParts(left);
  const b = decimalParts(right);
  const scale = Math.max(a.scale, b.scale);
  return decimalText(
    a.digits * 10n ** BigInt(scale - a.scale) -
      b.digits * 10n ** BigInt(scale - b.scale),
    scale,
  );
}

function decimalCompare(left, right) {
  const a = decimalParts(left);
  const b = decimalParts(right);
  const scale = Math.max(a.scale, b.scale);
  const aDigits = a.digits * 10n ** BigInt(scale - a.scale);
  const bDigits = b.digits * 10n ** BigInt(scale - b.scale);
  return aDigits < bDigits ? -1 : aDigits > bDigits ? 1 : 0;
}

function normalizePositiveDecimal(value) {
  if (
    typeof value !== "string" ||
    value.length > 80 ||
    !DECIMAL_PATTERN.test(value)
  ) {
    return null;
  }
  const [wholePart, fractionPart = ""] = value.split(".");
  const whole = wholePart.replace(/^0+(?=\d)/, "");
  const fraction = fractionPart.replace(/0+$/, "");
  if (whole === "0" && fraction.length === 0) return null;
  return whole + (fraction ? "." + fraction : "");
}

function uuid(prefix, sequence) {
  return `${prefix}-0000-4000-8000-${String(sequence).padStart(12, "0")}`;
}

function timestamp(minutes) {
  return new Date(
    Date.parse("2026-09-25T01:00:00.000Z") + minutes * 60_000,
  ).toISOString();
}

function half(value) {
  const { digits, scale } = decimalParts(value);
  return decimalText(digits * 5n, scale + 1);
}

function itemReceived(dispatch, dispatchItemId) {
  return decimalSum(
    dispatch.receipts.flatMap((receipt) =>
      receipt.items
        .filter((item) => item.dispatch_item_id === dispatchItemId)
        .map((item) => item.quantity_received),
    ),
  );
}

function itemShortageClosed(dispatch, dispatchItemId) {
  return decimalSum(
    dispatch.shortage_closures.flatMap((closure) =>
      closure.items
        .filter((item) => item.dispatch_item_id === dispatchItemId)
        .map((item) => item.quantity_closed),
    ),
  );
}

function refreshItem(dispatch, item) {
  item.quantity_received = itemReceived(dispatch, item.id);
  item.quantity_shortage_closed = itemShortageClosed(dispatch, item.id);
  item.quantity_in_transit = decimalSubtract(
    decimalSubtract(item.quantity_dispatched, item.quantity_received),
    item.quantity_shortage_closed,
  );
}

function refreshStatus(dispatch) {
  const hasRemaining = dispatch.items.some(
    (item) => decimalCompare(item.quantity_in_transit, "0") > 0,
  );
  const hasReceipts = dispatch.items.some(
    (item) => decimalCompare(item.quantity_received, "0") > 0,
  );
  const hasShortages = dispatch.items.some(
    (item) => decimalCompare(item.quantity_shortage_closed, "0") > 0,
  );
  if (hasRemaining) {
    dispatch.status = hasReceipts ? "PARTIALLY_RECEIVED" : "IN_TRANSIT";
  } else {
    dispatch.status = hasShortages ? "CLOSED_WITH_SHORTAGE" : "RECEIVED";
  }
}

function withoutInternalKeys(value) {
  const publicValue = { ...value };
  delete publicValue.idempotency_key;
  return publicValue;
}

function dispatchDetail(dispatch) {
  return {
    ...withoutInternalKeys(dispatch),
    items: dispatch.items.map((item) => ({
      ...withoutInternalKeys(item),
      quantity_in_transit:
        dispatch.status === "DRAFT" ? "0" : item.quantity_in_transit,
    })),
    receipts: dispatch.receipts.map((receipt) => ({
      ...withoutInternalKeys(receipt),
      items: receipt.items.map(withoutInternalKeys),
    })),
    shortage_closures: dispatch.shortage_closures.map((closure) => ({
      ...withoutInternalKeys(closure),
      items: closure.items.map(withoutInternalKeys),
    })),
    events: dispatch.events.map(withoutInternalKeys),
  };
}

function dispatchListItem(dispatch) {
  const listItem = dispatchDetail(dispatch);
  delete listItem.items;
  delete listItem.receipts;
  delete listItem.shortage_closures;
  delete listItem.events;
  return {
    ...listItem,
    discrepancy_status: dispatch.discrepancy?.status ?? null,
    item_count: dispatch.items.length,
  };
}

function makeReceipt(lines, seed, id, idempotencyKey, createdAt) {
  return {
    id,
    idempotency_key: idempotencyKey,
    received_by_user_id: seed.user.id,
    receiver_name: "Fixture Branch Manager",
    created_at: createdAt,
    items: lines.map(({ item, quantity }, index) => ({
      receipt_item_id: uuid(
        "59000000",
        Number(id.slice(-12)) * 100 + index + 1,
      ),
      dispatch_item_id: item.id,
      stock_item_id: item.stock_item_id,
      stock_item_name: item.stock_item_name,
      unit: item.unit,
      quantity_received: quantity,
    })),
  };
}

function makeShortageClosure(
  lines,
  seed,
  id,
  idempotencyKey,
  reason,
  createdAt,
) {
  return {
    id,
    idempotency_key: idempotencyKey,
    closed_by_user_id: seed.user.id,
    closer_name: "Fixture Operations Lead",
    reason,
    created_at: createdAt,
    items: lines.map(({ item, quantity }, index) => ({
      closure_item_id: uuid(
        "61000000",
        Number(id.slice(-12)) * 100 + index + 1,
      ),
      dispatch_item_id: item.id,
      stock_item_id: item.stock_item_id,
      stock_item_name: item.stock_item_name,
      unit: item.unit,
      quantity_closed: quantity,
    })),
  };
}

function createDispatchSeed(stockRequests, seed) {
  const statuses = [
    "DRAFT",
    "IN_TRANSIT",
    "PARTIALLY_RECEIVED",
    "RECEIVED",
    "CLOSED_WITH_SHORTAGE",
  ];

  return stockRequests
    .filter((request) => request.status === "APPROVED")
    .map((request, dispatchIndex) => {
      const status = statuses[dispatchIndex % statuses.length];
      const dispatchId = uuid("36000000", dispatchIndex + 1);
      const createdAt = timestamp(dispatchIndex);
      const dispatchedAt =
        status === "DRAFT" ? null : timestamp(dispatchIndex + 1);
      const sortedRequestItems = [...request.items].sort((left, right) =>
        left.stock_item_name.localeCompare(right.stock_item_name),
      );
      const dispatch = {
        id: dispatchId,
        idempotency_key: uuid("72000000", dispatchIndex + 1),
        branch_id: request.branch_id,
        branch_name: request.branch_name,
        status,
        created_by_user_id: seed.user.id,
        created_by_name: "Fixture Operations Lead",
        dispatched_by_user_id: status === "DRAFT" ? null : seed.user.id,
        dispatched_by_name:
          status === "DRAFT" ? null : "Fixture Operations Lead",
        dispatched_at: dispatchedAt,
        created_at: createdAt,
        updated_at: dispatchedAt ?? createdAt,
        items: sortedRequestItems.map((requestItem, itemIndex) => {
          const quantity = normalizePositiveDecimal(
            requestItem.quantity_requested,
          );
          const received =
            status === "RECEIVED"
              ? quantity
              : status === "PARTIALLY_RECEIVED" ||
                  status === "CLOSED_WITH_SHORTAGE"
                ? half(quantity)
                : "0";
          const shortageClosed =
            status === "CLOSED_WITH_SHORTAGE"
              ? decimalSubtract(quantity, received)
              : "0";
          return {
            id: uuid("56000000", dispatchIndex * 100 + itemIndex + 1),
            stock_item_id: requestItem.stock_item_id,
            stock_item_name: requestItem.stock_item_name,
            unit: requestItem.unit,
            quantity_dispatched: quantity,
            quantity_received: received,
            quantity_shortage_closed: shortageClosed,
            quantity_in_transit: decimalSubtract(
              decimalSubtract(quantity, received),
              shortageClosed,
            ),
          };
        }),
        receipts: [],
        shortage_closures: [],
        events: [],
        discrepancy: null,
        discrepancy_events: [],
      };

      const dispatchEvent = (
        eventType,
        eventIndex,
        receiptId = null,
        closureId = null,
        eventKey = null,
      ) => ({
        id: uuid("57000000", dispatchIndex * 10 + eventIndex + 1),
        event_type: eventType,
        actor_user_id: seed.user.id,
        actor_name: "Fixture Operations Lead",
        dispatch_receipt_id: receiptId,
        shortage_closure_id: closureId,
        ...(eventKey ? { idempotency_key: eventKey } : {}),
        created_at: timestamp(dispatchIndex + eventIndex),
      });
      dispatch.events.push(
        dispatchEvent("CREATED", 0, null, null, dispatch.idempotency_key),
      );
      if (status !== "DRAFT")
        dispatch.events.push(dispatchEvent("DISPATCHED", 1));

      const receivedLines = dispatch.items
        .filter((item) => decimalCompare(item.quantity_received, "0") > 0)
        .map((item) => ({ item, quantity: item.quantity_received }));
      if (receivedLines.length > 0) {
        const receiptId = uuid("58000000", dispatchIndex + 1);
        dispatch.receipts.push(
          makeReceipt(
            receivedLines,
            seed,
            receiptId,
            uuid("73000000", dispatchIndex + 1),
            timestamp(dispatchIndex + 2),
          ),
        );
        dispatch.events.push(
          dispatchEvent(
            "RECEIPT_RECORDED",
            2,
            receiptId,
            null,
            uuid("73000000", dispatchIndex + 1),
          ),
        );
      }

      const shortageLines = dispatch.items
        .filter(
          (item) => decimalCompare(item.quantity_shortage_closed, "0") > 0,
        )
        .map((item) => ({ item, quantity: item.quantity_shortage_closed }));
      if (shortageLines.length > 0) {
        const closureId = uuid("60000000", dispatchIndex + 1);
        dispatch.shortage_closures.push(
          makeShortageClosure(
            shortageLines,
            seed,
            closureId,
            uuid("74000000", dispatchIndex + 1),
            "Fixture delivery shortage recorded after a partial receipt.",
            timestamp(dispatchIndex + 3),
          ),
        );
        dispatch.events.push(
          dispatchEvent(
            "SHORTAGE_CLOSED",
            3,
            null,
            closureId,
            uuid("74000000", dispatchIndex + 1),
          ),
        );
      }
      if (
        status === "PARTIALLY_RECEIVED" ||
        status === "RECEIVED" ||
        status === "CLOSED_WITH_SHORTAGE"
      )
        dispatch.updated_at = timestamp(dispatchIndex + 3);
      if (status === "PARTIALLY_RECEIVED" && dispatchIndex === 2) {
        const reportedAt = timestamp(dispatchIndex + 4);
        dispatch.discrepancy = {
          id: uuid("62000000", dispatchIndex + 1),
          status: "OPEN",
          reported_by_user_id: seed.user.id,
          reported_by_name: "Fixture Branch Manager",
          reported_at: reportedAt,
          recount_requested_by_user_id: null,
          recount_requested_by_name: null,
          recount_requested_at: null,
          resolved_at: null,
        };
        dispatch.discrepancy_events.push({
          id: uuid("63000000", dispatchIndex + 1),
          event_type: "REPORTED",
          actor_user_id: seed.user.id,
          actor_name: "Fixture Branch Manager",
          note: "The delivery count is short; please recount the remaining items.",
          created_at: reportedAt,
        });
      }
      return dispatch;
    });
}

function validIdempotencyKey(key) {
  return (
    typeof key === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      key,
    )
  );
}

function actionLines(bodyItems, quantityField) {
  if (
    !Array.isArray(bodyItems) ||
    bodyItems.length < 1 ||
    bodyItems.length > 100
  )
    return null;
  const seen = new Set();
  const lines = [];
  for (const line of bodyItems) {
    const quantity = normalizePositiveDecimal(line?.[quantityField]);
    if (
      typeof line?.dispatch_item_id !== "string" ||
      quantity === null ||
      seen.has(line.dispatch_item_id)
    ) {
      return null;
    }
    seen.add(line.dispatch_item_id);
    lines.push({ dispatch_item_id: line.dispatch_item_id, quantity });
  }
  return lines;
}

function actionFingerprint(lines, reason = "") {
  const items = lines
    .map((line) => `${line.dispatch_item_id}:${line.quantity}`)
    .sort()
    .join("|");
  return reason ? `${reason}|${items}` : items;
}

function resolveIdempotency(state, key, kind, dispatchId, fingerprint) {
  const existing = state.dispatchActionKeys.find(
    (action) => action.key === key,
  );
  if (!existing) {
    const previouslyStored = state.dispatches.some(
      (dispatch) =>
        dispatch.idempotency_key === key ||
        dispatch.events.some((event) => event.idempotency_key === key) ||
        dispatch.receipts.some((receipt) => receipt.idempotency_key === key) ||
        dispatch.shortage_closures.some(
          (closure) => closure.idempotency_key === key,
        ),
    );
    return previouslyStored ? { conflict: true } : null;
  }
  if (
    existing.kind !== kind ||
    existing.dispatch_id !== dispatchId ||
    existing.fingerprint !== fingerprint
  ) {
    return { conflict: true };
  }
  return { conflict: false };
}

function recordIdempotency(state, key, kind, dispatchId, fingerprint) {
  state.dispatchActionKeys.push({
    key,
    kind,
    dispatch_id: dispatchId,
    fingerprint,
  });
}

function addEvent(
  dispatch,
  seed,
  eventType,
  idempotencyKey,
  timestampValue,
  receiptId = null,
  closureId = null,
) {
  dispatch.events.push({
    id: uuid(
      "57000000",
      dispatch.events.length +
        dispatch.items.length * 100 +
        stateSafeSequence(dispatch.id),
    ),
    event_type: eventType,
    actor_user_id: seed.user.id,
    actor_name: "Fixture Operations Lead",
    dispatch_receipt_id: receiptId,
    shortage_closure_id: closureId,
    idempotency_key: idempotencyKey,
    created_at: timestampValue,
  });
}

function stateSafeSequence(dispatchId) {
  return Number(dispatchId.slice(-12));
}

function conflict(response, message) {
  return send(response, 409, { message });
}

function send(response, status, payload, headers = {}) {
  response.writeHead(status, {
    "cache-control": "no-store",
    ...(payload === undefined ? {} : { "content-type": "application/json" }),
    ...headers,
  });
  response.end(payload === undefined ? undefined : JSON.stringify(payload));
}

function handleDispatchRequest({ request, response, url, body, state, seed }) {
  const actorId = seed.user.id;
  const key = request.headers["idempotency-key"];

  if (url.pathname === "/dispatches" && request.method === "GET") {
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number(url.searchParams.get("page_size")) || 25),
    );
    const status = url.searchParams.get("status");
    const branchId = url.searchParams.get("branch_id");
    if (status && !DISPATCH_STATUSES.includes(status))
      return send(response, 400, { message: "Invalid dispatch status." });
    const matches = state.dispatches
      .filter(
        (dispatch) =>
          (!status || dispatch.status === status) &&
          (!branchId || dispatch.branch_id === branchId),
      )
      .sort(
        (left, right) =>
          right.created_at.localeCompare(left.created_at) ||
          right.id.localeCompare(left.id),
      );
    const start = (page - 1) * pageSize;
    return send(response, 200, {
      items: matches.slice(start, start + pageSize).map(dispatchListItem),
      total: matches.length,
      page,
      page_size: pageSize,
    });
  }

  const sending = url.pathname === "/dispatches/send";
  if (
    (url.pathname === "/dispatches" || sending) &&
    request.method === "POST"
  ) {
    if (
      !validIdempotencyKey(key) ||
      typeof body?.branch_id !== "string" ||
      !Array.isArray(body.items) ||
      body.items.length < 1 ||
      body.items.length > 100
    )
      return send(response, 400, { message: "Check the dispatch request." });
    const branch = state.branches.find(
      (item) => item.id === body.branch_id && item.status === "active",
    );
    if (!branch)
      return send(response, 404, { message: "Active branch not found." });
    const seenStockItemIds = new Set();
    const lines = body.items.map((line) => {
      const quantity = normalizePositiveDecimal(line?.quantity_dispatched);
      const stockItem = state.stockItems.find(
        (item) => item.id === line?.stock_item_id && item.is_active,
      );
      if (!stockItem || quantity === null || seenStockItemIds.has(stockItem.id))
        return null;
      seenStockItemIds.add(stockItem.id);
      return { stockItem, quantity };
    });
    if (lines.some((line) => line === null))
      return send(response, 400, {
        message: "Choose unique active stock items and positive quantities.",
      });
    const fingerprint = `${branch.id}|${lines
      .map((line) => `${line.stockItem.id}:${line.quantity}`)
      .sort()
      .join("|")}`;
    const kind = sending ? "send" : "create";
    const retry = resolveIdempotency(state, key, kind, "", fingerprint);
    if (retry) {
      if (retry.conflict)
        return conflict(response, "Idempotency key was already used.");
      const existing = state.dispatches.find(
        (dispatch) => dispatch.idempotency_key === key,
      );
      return send(response, 201, dispatchDetail(existing));
    }
    const sendBalances = sending
      ? lines.map(({ stockItem, quantity }) => ({
          stockItem,
          quantity,
          balance: state.commissaryBalances.find(
            (balance) => balance.id === stockItem.id,
          ),
        }))
      : [];
    const insufficient = sendBalances.find(
      ({ balance, quantity }) =>
        !balance || decimalCompare(balance.quantity_on_hand, quantity) < 0,
    );
    if (insufficient)
      return send(response, 400, {
        message: `Insufficient commissary inventory for ${insufficient.stockItem.stock_item_name}. Reduce the quantity or replenish stock.`,
      });
    const dispatchNumber = state.dispatches.length + 1;
    const createdAt = timestamp(state.dispatchActionKeys.length + 100);
    const dispatch = {
      id: uuid("36000000", dispatchNumber),
      idempotency_key: key,
      branch_id: branch.id,
      branch_name: branch.branch_name,
      status: sending ? "IN_TRANSIT" : "DRAFT",
      created_by_user_id: actorId,
      created_by_name: "Fixture Operations Lead",
      dispatched_by_user_id: sending ? actorId : null,
      dispatched_by_name: sending ? "Fixture Operations Lead" : null,
      dispatched_at: sending ? createdAt : null,
      created_at: createdAt,
      updated_at: createdAt,
      items: lines.map(({ stockItem, quantity }, itemIndex) => ({
        id: uuid("56000000", dispatchNumber * 100 + itemIndex + 1),
        stock_item_id: stockItem.id,
        stock_item_name: stockItem.stock_item_name,
        unit: stockItem.unit,
        quantity_dispatched: quantity,
        quantity_received: "0",
        quantity_shortage_closed: "0",
        quantity_in_transit: quantity,
      })),
      receipts: [],
      shortage_closures: [],
      events: [],
    };
    for (const { stockItem, quantity, balance } of sendBalances) {
      balance.quantity_on_hand = decimalSubtract(
        balance.quantity_on_hand,
        quantity,
      );
      const line = dispatch.items.find(
        (line) => line.stock_item_id === stockItem.id,
      );
      state.commissaryMovements.push({
        id: uuid("74000000", state.commissaryMovements.length + 1),
        inventory_scope: "COMMISSARY",
        branch_id: null,
        stock_item_id: stockItem.id,
        stock_item_name: stockItem.stock_item_name,
        unit: stockItem.unit,
        movement_type: "DISPATCH",
        quantity_delta: decimalText(
          -decimalParts(quantity).digits,
          decimalParts(quantity).scale,
        ),
        reason: `Dispatch ${dispatch.id}`,
        actor_user_id: actorId,
        dispatch_item_id: line.id,
        idempotency_key: key,
        created_at: createdAt,
      });
    }
    addEvent(
      dispatch,
      seed,
      sending ? "DISPATCHED" : "CREATED",
      key,
      createdAt,
    );
    state.dispatches.push(dispatch);
    recordIdempotency(state, key, kind, "", fingerprint);
    return send(response, 201, dispatchDetail(dispatch));
  }

  const dispatchRoute = url.pathname.match(
    /^\/dispatches\/([0-9a-f-]{36})(?:\/(dispatch|receive|shortage-closures))?$/i,
  );
  if (!dispatchRoute) return false;
  const dispatch = state.dispatches.find(
    (item) => item.id === dispatchRoute[1],
  );
  if (!dispatch) return send(response, 404, { message: "Dispatch not found." });
  const action = dispatchRoute[2];
  if (request.method === "GET" && !action)
    return send(response, 200, dispatchDetail(dispatch));
  if (request.method !== "POST" || !action) return false;
  if (!validIdempotencyKey(key))
    return send(response, 400, { message: "Missing idempotency key." });

  if (action === "dispatch") {
    const retry = resolveIdempotency(state, key, "dispatch", dispatch.id, "");
    if (retry) {
      if (retry.conflict)
        return conflict(response, "Idempotency key was already used.");
      return send(response, 200, dispatchDetail(dispatch));
    }
    if (dispatch.status !== "DRAFT")
      return conflict(response, "Dispatch is not in draft state.");
    const branch = state.branches.find(
      (item) => item.id === dispatch.branch_id && item.status === "active",
    );
    if (!branch)
      return send(response, 404, { message: "Active branch not found." });
    const balances = dispatch.items.map((item) => ({
      item,
      balance: state.commissaryBalances.find(
        (candidate) => candidate.id === item.stock_item_id,
      ),
    }));
    if (
      balances.some(
        ({ item, balance }) =>
          !balance ||
          decimalCompare(balance.quantity_on_hand, item.quantity_dispatched) <
            0,
      )
    ) {
      return conflict(response, "Commissary inventory is insufficient.");
    }
    for (const { item, balance } of balances) {
      balance.quantity_on_hand = decimalSubtract(
        balance.quantity_on_hand,
        item.quantity_dispatched,
      );
      state.commissaryMovements.push({
        id: uuid("74000000", state.commissaryMovements.length + 1),
        inventory_scope: "COMMISSARY",
        branch_id: null,
        stock_item_id: item.stock_item_id,
        stock_item_name: item.stock_item_name,
        unit: item.unit,
        movement_type: "DISPATCH",
        quantity_delta: decimalText(
          -decimalParts(item.quantity_dispatched).digits,
          decimalParts(item.quantity_dispatched).scale,
        ),
        reason: `Dispatch ${dispatch.id}`,
        actor_user_id: actorId,
        idempotency_key: key,
        created_at: timestamp(state.dispatchActionKeys.length + 200),
      });
    }
    const dispatchedAt = timestamp(state.dispatchActionKeys.length + 200);
    dispatch.status = "IN_TRANSIT";
    dispatch.dispatched_by_user_id = actorId;
    dispatch.dispatched_by_name = "Fixture Operations Lead";
    dispatch.dispatched_at = dispatchedAt;
    dispatch.updated_at = dispatchedAt;
    addEvent(dispatch, seed, "DISPATCHED", key, dispatchedAt);
    recordIdempotency(state, key, "dispatch", dispatch.id, "");
    return send(response, 200, dispatchDetail(dispatch));
  }

  if (action === "receive" || action === "shortage-closures") {
    const isShortage = action === "shortage-closures";
    const lines = actionLines(
      body?.items,
      isShortage ? "quantity_closed" : "quantity_received",
    );
    const reason = isShortage ? body?.reason?.trim() : "";
    if (!lines || (isShortage && (!reason || reason.length > 500)))
      return send(response, 400, { message: "Invalid dispatch quantities." });
    const fingerprint = actionFingerprint(lines, reason);
    const kind = isShortage ? "shortage" : "receive";
    const retry = resolveIdempotency(
      state,
      key,
      kind,
      dispatch.id,
      fingerprint,
    );
    if (retry) {
      if (retry.conflict)
        return conflict(response, "Idempotency key was already used.");
      return send(response, 200, dispatchDetail(dispatch));
    }
    if (dispatch.status === "DRAFT")
      return conflict(response, "Dispatch must be posted before this action.");
    if (
      dispatch.status === "RECEIVED" ||
      dispatch.status === "CLOSED_WITH_SHORTAGE"
    )
      return conflict(response, "Dispatch has no remaining in-transit items.");
    if (!isShortage) {
      const branch = state.branches.find(
        (item) => item.id === dispatch.branch_id && item.status === "active",
      );
      if (!branch)
        return send(response, 404, { message: "Active branch not found." });
    }
    const resolvedLines = [];
    for (const line of lines) {
      const item = dispatch.items.find(
        (candidate) => candidate.id === line.dispatch_item_id,
      );
      if (!item)
        return send(response, 404, { message: "Dispatch item not found." });
      refreshItem(dispatch, item);
      if (decimalCompare(line.quantity, item.quantity_in_transit) > 0)
        return send(response, 400, {
          message: "Quantity exceeds the remaining in-transit amount.",
        });
      resolvedLines.push({ item, quantity: line.quantity });
    }

    const createdAt = timestamp(state.dispatchActionKeys.length + 300);
    const recordSequence = state.dispatchActionKeys.length + 1001;
    if (isShortage) {
      const closureId = uuid("60000000", recordSequence);
      dispatch.shortage_closures.push(
        makeShortageClosure(
          resolvedLines,
          seed,
          closureId,
          key,
          reason,
          createdAt,
        ),
      );
      for (const item of dispatch.items) refreshItem(dispatch, item);
      refreshStatus(dispatch);
      dispatch.updated_at = createdAt;
      addEvent(
        dispatch,
        seed,
        "SHORTAGE_CLOSED",
        key,
        createdAt,
        null,
        closureId,
      );
    } else {
      const receiptId = uuid("58000000", recordSequence);
      dispatch.receipts.push(
        makeReceipt(resolvedLines, seed, receiptId, key, createdAt),
      );
      for (const item of dispatch.items) refreshItem(dispatch, item);
      refreshStatus(dispatch);
      dispatch.updated_at = createdAt;
      addEvent(dispatch, seed, "RECEIPT_RECORDED", key, createdAt, receiptId);
    }
    recordIdempotency(state, key, kind, dispatch.id, fingerprint);
    return send(response, 200, dispatchDetail(dispatch));
  }
  return false;
}

module.exports = {
  createDispatchSeed,
  dispatchDetail,
  dispatchListItem,
  handleDispatchRequest,
};
