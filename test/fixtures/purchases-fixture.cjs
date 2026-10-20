// Simulated UI fixture only. Real atomic posting is covered by API integration tests.
const { randomUUID } = require("node:crypto");
function send(response, status, body) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}
function handlePurchaseRequest({ request, response, url, body, state, seed }) {
  if (!url.pathname.startsWith("/direct-purchases")) return false;
  state.purchases ??= [];
  if (request.method === "POST" && url.pathname === "/direct-purchases") {
    const existing = state.purchases.find(
      (row) => row.key === request.headers["idempotency-key"],
    );
    if (existing) return send(response, 201, existing);
    const items = body.items.map((line) => {
      const stock = state.stockItems.find(
        (item) => item.id === line.stock_item_id,
      );
      return {
        ...line,
        id: randomUUID(),
        stock_item_name: stock.stock_item_name,
        unit: stock.unit,
        line_total: String(
          Number(line.quantity_received) * Number(line.unit_cost),
        ),
      };
    });
    const purchase = {
      ...body,
      id: randomUUID(),
      key: request.headers["idempotency-key"],
      store_name: body.store_name || null,
      receipt_number: body.receipt_number || null,
      notes: body.notes || null,
      recorded_at: new Date().toISOString(),
      recorded_by_name: seed.user.fullName || "Fixture receiver",
      items,
      item_count: items.length,
      total_cost: String(
        items.reduce((sum, line) => sum + Number(line.line_total), 0),
      ),
    };
    state.purchases.unshift(purchase);
    for (const item of items) {
      const balance = state.commissaryBalances.find(
        (row) => row.id === item.stock_item_id,
      );
      balance.quantity_on_hand = String(
        Number(balance.quantity_on_hand) + Number(item.quantity_received),
      );
      balance.updated_at = new Date().toISOString();
      state.commissaryMovements.unshift({
        id: randomUUID(),
        inventory_scope: "COMMISSARY",
        branch_id: null,
        stock_item_id: item.stock_item_id,
        stock_item_name: item.stock_item_name,
        unit: item.unit,
        movement_type: "RECEIPT",
        quantity_delta: item.quantity_received,
        reason: "Purchase received",
        actor_user_id: seed.user.id,
        idempotency_key: null,
        created_at: new Date().toISOString(),
        receipt_id: purchase.id,
        receipt_kind: "DIRECT_PURCHASE",
      });
    }
    return send(response, 201, purchase);
  }
  if (url.pathname === "/direct-purchases") {
    const search = (url.searchParams.get("search") || "").toLowerCase();
    const from = url.searchParams.get("purchased_from");
    const to = url.searchParams.get("purchased_to");
    let items = state.purchases.filter(
      (item) =>
        (item.store_name + " " + item.receipt_number)
          .toLowerCase()
          .includes(search) &&
        (!from || item.purchase_date >= from) &&
        (!to || item.purchase_date <= to),
    );
    items.sort(
      (a, b) =>
        b.purchase_date.localeCompare(a.purchase_date) ||
        b.recorded_at.localeCompare(a.recorded_at) ||
        a.id.localeCompare(b.id),
    );
    if (url.searchParams.get("sort") === "oldest")
      items = items.slice().reverse();
    const page = Number(url.searchParams.get("page") || 1);
    const page_size = Number(url.searchParams.get("page_size") || 10);
    return send(response, 200, {
      items: items.slice((page - 1) * page_size, page * page_size),
      total: items.length,
      page,
      page_size,
    });
  }
  const item = state.purchases.find(
    (row) => row.id === url.pathname.split("/").at(-1),
  );
  return send(
    response,
    item ? 200 : 404,
    item || { message: "Purchase not found" },
  );
}
module.exports = { handlePurchaseRequest };
