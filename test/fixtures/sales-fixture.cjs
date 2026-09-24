const DECIMAL = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function uuid(prefix, sequence) {
  return `${prefix}-0000-4000-8000-${String(sequence).padStart(12, "0")}`;
}

function decimalParts(value) {
  const [whole, fraction = ""] = value.split(".");
  return { digits: BigInt(whole + fraction), scale: fraction.length };
}

function decimalText(digits, scale) {
  let result = String(digits).padStart(scale + 1, "0");
  if (scale > 0) {
    const split = result.length - scale;
    result = result.slice(0, split) + "." + result.slice(split);
    result = result.replace(/0+$/, "").replace(/\.$/, "");
  }
  return result;
}

function normalizeDecimal(value) {
  const [wholePart, fractionPart = ""] = value.split(".");
  const whole = wholePart.replace(/^0+(?=\d)/, "");
  const fraction = fractionPart.replace(/0+$/, "");
  return whole + (fraction ? `.${fraction}` : "");
}

function multiply(left, right) {
  const a = decimalParts(left);
  const b = decimalParts(right);
  return decimalText(a.digits * b.digits, a.scale + b.scale);
}

function sum(values) {
  const parts = values.map(decimalParts);
  const scale = Math.max(0, ...parts.map((part) => part.scale));
  const total = parts.reduce(
    (result, part) => result + part.digits * 10n ** BigInt(scale - part.scale),
    0n,
  );
  return decimalText(total, scale);
}

function createSalesSeed({ branches, products, branchProducts, seed }) {
  const branch = branches[0];
  return Array.from({ length: 26 }, (_, index) => {
    const product = products[index === 0 ? 1 : index % 2];
    const offer = branchProducts.find(
      (candidate) =>
        candidate.branch_id === branch.id &&
        candidate.product_id === product.id,
    );
    const createdAt = new Date(
      Date.parse("2026-09-25T01:30:00.000Z") - index * 60_000,
    ).toISOString();
    const saleId = uuid("65000000", index + 1);
    const quantity = index === 0 ? "1.25" : "1";
    const lineTotal = multiply(quantity, offer.price);
    const status = index === 2 ? "VOIDED" : "COMPLETED";
    const events = [
      {
        id: uuid("68000000", index * 2 + 1),
        event_type: "COMPLETED",
        actor_user_id: seed.user.id,
        reason: null,
        created_at: createdAt,
      },
    ];
    if (status === "VOIDED") {
      events.push({
        id: uuid("68000000", index * 2 + 2),
        event_type: "VOIDED",
        actor_user_id: seed.user.id,
        reason: "Fixture sale was entered in error.",
        created_at: new Date(Date.parse(createdAt) + 30_000).toISOString(),
      });
    }
    return {
      id: saleId,
      branch_id: branch.id,
      cashier_user_id: seed.user.id,
      cashier_name:
        index === 0
          ? "Fixture Cashier With An Extended Name For Table Layout Verification"
          : `Fixture Cashier ${String(index + 1).padStart(2, "0")}`,
      status,
      tender_method: index % 2 === 0 ? "cash" : "card",
      total_amount: lineTotal,
      idempotency_key: uuid("67000000", index + 1),
      created_at: createdAt,
      items: [
        {
          id: uuid("66000000", index + 1),
          product_id: product.id,
          product_name_snapshot: product.product_name,
          quantity,
          unit_price: offer.price,
          line_total: lineTotal,
          created_at: createdAt,
        },
      ],
      events,
    };
  });
}

function detail(sale) {
  const value = { ...sale };
  delete value.cashier_name;
  return value;
}

function listItem(sale) {
  const value = { ...sale };
  delete value.items;
  delete value.events;
  return value;
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

function validSale(body) {
  if (
    !body ||
    typeof body.tender_method !== "string" ||
    !body.tender_method.trim() ||
    body.tender_method.trim().length > 40 ||
    !Array.isArray(body.items) ||
    body.items.length < 1 ||
    body.items.length > 40
  )
    return false;
  const productIds = new Set();
  return body.items.every((item) => {
    if (
      !item ||
      !UUID.test(item.product_id) ||
      typeof item.quantity !== "string" ||
      item.quantity.length > 80 ||
      !DECIMAL.test(item.quantity) ||
      BigInt(item.quantity.replace(".", "")) === 0n ||
      productIds.has(item.product_id)
    )
      return false;
    productIds.add(item.product_id);
    return true;
  });
}

function send(response, status, payload) {
  response.writeHead(status, {
    "cache-control": "no-store",
    "content-type": "application/json",
  });
  response.end(JSON.stringify(payload));
}

function actionRetry(state, key, action, subject, fingerprint) {
  const previous = state.saleActionKeys.find((entry) => entry.key === key);
  if (!previous) return null;
  return {
    conflict:
      previous.action !== action ||
      previous.subject !== subject ||
      previous.fingerprint !== fingerprint,
    sale: state.sales.find((sale) => sale.id === previous.saleId),
  };
}

function recordAction(state, key, action, subject, fingerprint, saleId) {
  state.saleActionKeys.push({ key, action, subject, fingerprint, saleId });
}

function validKey(value) {
  return typeof value === "string" && UUID.test(value);
}

function handleSalesRequest({ request, response, url, body, state, seed }) {
  const route = url.pathname.match(
    /^\/branches\/([0-9a-f-]{36})\/sales(?:\/([0-9a-f-]{36})(?:\/(void))?)?$/i,
  );
  if (!route) return false;

  const branch = state.branches.find((candidate) => candidate.id === route[1]);
  if (!branch) return send(response, 404, { message: "Branch not found." });
  const saleId = route[2];
  const action = route[3];

  if (request.method === "GET" && !saleId) {
    const sales = state.sales
      .filter((sale) => sale.branch_id === branch.id)
      .sort(
        (left, right) =>
          right.created_at.localeCompare(left.created_at) ||
          right.id.localeCompare(left.id),
      );
    const page = pageItems(sales, url);
    return send(response, 200, {
      ...page,
      items: page.items.map(listItem),
    });
  }

  if (request.method === "GET" && saleId && !action) {
    const sale = state.sales.find(
      (candidate) =>
        candidate.id === saleId && candidate.branch_id === branch.id,
    );
    return sale
      ? send(response, 200, detail(sale))
      : send(response, 404, { message: "Sale not found." });
  }

  if (request.method === "POST" && !saleId) {
    const key = request.headers["idempotency-key"];
    if (!validKey(key) || !validSale(body))
      return send(response, 400, {
        message: "Check sale items and tender method.",
      });
    const normalized = {
      tender_method: body.tender_method.trim(),
      items: body.items.map((item) => ({
        product_id: item.product_id.toLowerCase(),
        quantity: normalizeDecimal(item.quantity),
      })),
    };
    const fingerprint = JSON.stringify(normalized);
    const retry = actionRetry(state, key, "create", branch.id, fingerprint);
    if (retry) {
      if (retry.conflict)
        return send(response, 409, { message: "Idempotency key conflict." });
      return send(response, 201, detail(retry.sale));
    }
    if (branch.status !== "active")
      return send(response, 404, { message: "Active branch not found." });

    const lines = [];
    for (const item of normalized.items) {
      const product = state.products.find(
        (candidate) => candidate.id === item.product_id,
      );
      const offer = state.branchProducts.find(
        (candidate) =>
          candidate.branch_id === branch.id &&
          candidate.product_id === item.product_id,
      );
      if (!product?.is_active || !offer?.is_available)
        return send(response, 409, { message: "Product is not available." });
      const lineTotal = multiply(item.quantity, offer.price);
      lines.push({
        id: uuid("66000000", state.sales.length * 100 + lines.length + 1),
        product_id: product.id,
        product_name_snapshot: product.product_name,
        quantity: item.quantity,
        unit_price: offer.price,
        line_total: lineTotal,
        created_at: "2026-09-25T05:00:00.000Z",
      });
    }
    const sale = {
      id: uuid("65000000", state.sales.length + 1),
      branch_id: branch.id,
      cashier_user_id: seed.user.id,
      cashier_name: seed.user.full_name,
      status: "COMPLETED",
      tender_method: normalized.tender_method,
      total_amount: sum(lines.map((line) => line.line_total)),
      idempotency_key: key,
      created_at: "2026-09-25T05:00:00.000Z",
      items: lines,
      events: [
        {
          id: uuid("68000000", state.sales.length * 2 + 1),
          event_type: "COMPLETED",
          actor_user_id: seed.user.id,
          reason: null,
          created_at: "2026-09-25T05:00:00.000Z",
        },
      ],
    };
    state.sales.push(sale);
    recordAction(state, key, "create", branch.id, fingerprint, sale.id);
    return send(response, 201, detail(sale));
  }

  if (request.method === "POST" && saleId && action === "void") {
    const sale = state.sales.find(
      (candidate) =>
        candidate.id === saleId && candidate.branch_id === branch.id,
    );
    if (!sale) return send(response, 404, { message: "Sale not found." });
    const key = request.headers["idempotency-key"];
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
    if (!validKey(key) || !reason || reason.length > 500)
      return send(response, 400, {
        message: "A valid void reason is required.",
      });
    const fingerprint = reason;
    const retry = actionRetry(state, key, "void", sale.id, fingerprint);
    if (retry) {
      if (retry.conflict)
        return send(response, 409, { message: "Idempotency key conflict." });
      return send(response, 200, detail(retry.sale));
    }
    if (sale.status !== "COMPLETED")
      return send(response, 409, { message: "Sale is already voided." });
    sale.status = "VOIDED";
    sale.events.push({
      id: uuid("68000000", state.saleActionKeys.length * 2 + 200),
      event_type: "VOIDED",
      actor_user_id: seed.user.id,
      reason,
      created_at: "2026-09-25T05:01:00.000Z",
    });
    recordAction(state, key, "void", sale.id, fingerprint, sale.id);
    return send(response, 200, detail(sale));
  }

  return false;
}

module.exports = { createSalesSeed, handleSalesRequest, listItem };
