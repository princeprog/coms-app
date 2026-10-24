// Simulated UI backend only; real permissions, locks and transactions are API e2e responsibilities.
const { randomUUID } = require("node:crypto");
const assert = require("node:assert/strict");
const clone = (value) => structuredClone(value);
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const id = (number) =>
  `e0000000-0000-4000-8000-${String(number).padStart(12, "0")}`;
const units = (value) => {
  const [whole, fraction = ""] = String(value).split(".");
  return BigInt(whole) * 100000000n + BigInt(fraction.padEnd(8, "0"));
};
const decimal = (value) =>
  `${value / 100000000n}.${(value % 100000000n).toString().padStart(8, "0")}`
    .replace(/0+$/, "")
    .replace(/\.$/, "");
const total = (rows) =>
  decimal(rows.reduce((sum, row) => sum + units(row.amount), 0n));
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function createExpensesSeed(state, user) {
  const now = new Date().toISOString();
  const branches = state.branches.slice(0, 2);
  const locations = [
    {
      scope: "COMMISSARY",
      branch_id: null,
      name: "Commissary",
      is_active: true,
    },
    ...branches.map((branch) => ({
      scope: "BRANCH",
      branch_id: branch.id,
      name: branch.branch_name ?? branch.name,
      is_active: true,
    })),
  ];
  const categories = [
    "Transportation",
    "Utilities",
    "Rent",
    "Other",
    "Retired supplies",
  ].map((name, index) => ({
    id: id(index + 1),
    name,
    is_active: index !== 4,
    created_at: now,
    updated_at: now,
  }));
  const common = {
    expense_date: today(),
    source: "OPERATING",
    scope: "BRANCH",
    branch_id: branches[0].id,
    location_name: locations[1].name,
    category_id: categories[0].id,
    category_name: categories[0].name,
    payment_method: "CASH",
    cash_source: "OTHER",
    cash_movement_id: null,
    payee: "Local supplier",
    reference: null,
    notes: null,
    status: "RECORDED",
    revision: 1,
    created_by_user_id: user.id,
    created_by_name: user.full_name,
  };
  const records = Array.from({ length: 14 }, (_, index) => ({
    ...common,
    id: id(100 + index),
    description: `Delivery fuel ${String(index + 1).padStart(2, "0")}`,
    amount: `${index + 10}.10`,
    created_at: new Date(Date.now() - 60000 * (index + 10)).toISOString(),
    updated_at: now,
  }));
  records.push(
    ...["SUPPLIER_DELIVERY", "DIRECT_PURCHASE"].map((source, index) => ({
      ...common,
      id: id(200 + index),
      source,
      scope: "COMMISSARY",
      branch_id: null,
      location_name: "Commissary",
      category_id: "STOCK_PURCHASES",
      category_name: "Stock purchases",
      description: index ? "Market stock purchase" : "Supplier rice delivery",
      amount: index ? "0.30000000" : "24.72500000",
      payment_method: null,
      cash_source: null,
      payee: null,
      created_at: new Date(Date.now() - 30000).toISOString(),
      updated_at: now,
    })),
  );
  const history = Object.fromEntries(
    records
      .filter((row) => row.source === "OPERATING")
      .map((row) => [
        row.id,
        [
          {
            id: randomUUID(),
            action: "CREATED",
            reason: null,
            actor_name: user.full_name,
            created_at: row.created_at,
            before: null,
            after: clone(row),
          },
        ],
      ]),
  );
  return {
    categories,
    locations,
    records,
    history,
    requests: [],
    keys: {},
    failure: null,
    cashOuts: ["Motorcycle delivery fuel", "Market supplies reimbursement"].map(
      (reason, index) => ({
        id: id(300 + index),
        shift_id: id(400 + index),
        branch_id: branches[0].id,
        shift_number: 21 + index,
        business_date: today(),
        amount: index ? "120.10" : "87.65",
        reason,
        actor_name: user.full_name,
        created_at: now,
      }),
    ),
    // Deliberately unchanged by every Expenses operation, including register linking and voids.
    financialState: {
      expected_register_cash: "5000.00",
      stock_quantity: "125.0000",
      cash_movement_count: 2,
    },
  };
}

function send(response, status, body) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}
function detail(data, row) {
  return {
    record: row,
    history: data.history[row.id] ?? [],
    source_href:
      row.source === "OPERATING"
        ? null
        : row.source === "SUPPLIER_DELIVERY"
          ? `/receipts/${row.id}`
          : `/inventory/purchases?purchase_id=${row.id}`,
  };
}
function paginate(rows, params) {
  const page = Number(params.get("page") || 1),
    page_size = Number(params.get("page_size") || 10);
  return {
    items: rows.slice((page - 1) * page_size, page * page_size),
    total: rows.length,
    page,
    page_size,
  };
}
function filtered(data, params) {
  const search = (params.get("search") || "").toLowerCase(),
    status = params.get("status") || "RECORDED";
  let rows = data.records.filter(
    (row) =>
      (status === "all" || row.status === status) &&
      (!params.get("from") || row.expense_date >= params.get("from")) &&
      (!params.get("to") || row.expense_date <= params.get("to")) &&
      ["scope", "branch_id", "category_id", "source"].every(
        (key) => !params.get(key) || row[key] === params.get(key),
      ) &&
      [
        row.description,
        row.payee,
        row.reference,
        row.notes,
        row.location_name,
        row.category_name,
        row.created_by_name,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search),
  );
  const sort = params.get("sort") || "newest";
  rows = rows.slice().sort((a, b) => {
    if (sort.startsWith("amount_")) {
      const difference = units(a.amount) - units(b.amount);
      if (difference)
        return (
          (difference < 0n ? -1 : 1) * (sort === "amount_highest" ? -1 : 1)
        );
    }
    return (
      (a.expense_date.localeCompare(b.expense_date) ||
        a.created_at.localeCompare(b.created_at)) *
        (sort === "oldest" ? 1 : -1) || a.id.localeCompare(b.id)
    );
  });
  return rows;
}
function breakdown(rows, key, label) {
  return [...new Set(rows.map((row) => row[key] ?? "COMMISSARY"))].map(
    (value) => {
      const group = rows.filter((row) => (row[key] ?? "COMMISSARY") === value);
      return { id: value, name: group[0][label], amount: total(group) };
    },
  );
}

function handleExpensesRequest({
  request,
  response,
  url,
  body,
  state,
  authUser,
}) {
  if (!url.pathname.startsWith("/expenses")) return false;
  const data = (state.expensesFixture ??= createExpensesSeed(state, authUser));
  const route = url.pathname,
    method = request.method;
  if (route === "/expenses/__fixture/state") return send(response, 200, data);
  if (route === "/expenses/__fixture/fail-next" && method === "POST") {
    data.failure = body;
    return send(response, 200, { configured: true });
  }
  data.requests.push({
    method,
    path: route,
    query: Object.fromEntries(url.searchParams),
    body: clone(body ?? null),
    key: request.headers["idempotency-key"] ?? null,
  });
  if (data.failure?.path === route && data.failure.method === method) {
    const failure = data.failure;
    data.failure = null;
    return send(response, failure.status ?? 503, {
      message: failure.message ?? "Temporary expense outage. Try again.",
    });
  }
  if (route === "/expenses/locations" && method === "GET")
    return send(response, 200, { items: data.locations });
  if (route === "/expenses/categories" && method === "GET")
    return send(response, 200, { items: data.categories });
  if (
    (route === "/expenses/categories" && method === "POST") ||
    (route.startsWith("/expenses/categories/") && method === "PATCH")
  ) {
    const existing =
      method === "PATCH"
        ? data.categories.find((item) => item.id === route.split("/").at(-1))
        : null;
    if (method === "PATCH" && !existing)
      return send(response, 404, { message: "Category not found" });
    const name = body.name?.trim() ?? existing?.name;
    if (!name || name.toLowerCase() === "stock purchases")
      return send(response, 400, {
        message: "Choose an operating expense category name",
      });
    if (
      data.categories.some(
        (item) =>
          item.id !== existing?.id &&
          item.name.toLowerCase() === name.toLowerCase(),
      )
    )
      return send(response, 409, {
        message: "An expense category with this name already exists",
      });
    const now = new Date().toISOString();
    const category = {
      ...(existing ?? { id: randomUUID(), created_at: now, is_active: true }),
      name,
      ...(body.is_active === undefined ? {} : { is_active: body.is_active }),
      updated_at: now,
    };
    if (existing) Object.assign(existing, category);
    else data.categories.push(category);
    for (const row of data.records)
      if (row.category_id === category.id) row.category_name = name;
    return send(response, existing ? 200 : 201, category);
  }
  if (route === "/expenses/cash-outs" && method === "GET") {
    const search = (url.searchParams.get("search") || "").toLowerCase();
    const rows = data.cashOuts
      .filter(
        (item) =>
          item.branch_id === url.searchParams.get("branch_id") &&
          `${item.reason} ${item.shift_number}`
            .toLowerCase()
            .includes(search) &&
          !data.records.some(
            (row) =>
              row.status === "RECORDED" && row.cash_movement_id === item.id,
          ),
      )
      .map((item) => {
        const result = { ...item };
        delete result.branch_id;
        return result;
      });
    return send(response, 200, paginate(rows, url.searchParams));
  }
  if (method === "GET" && ["/expenses", "/expenses/export"].includes(route)) {
    const rows = filtered(data, url.searchParams);
    if (route.endsWith("/export")) {
      const cell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
      const lines = [
        [
          "Date",
          "Source",
          "Location",
          "Category",
          "Description",
          "Amount (PHP)",
          "Payment",
          "Status",
        ],
        ...rows.map((row) => [
          row.expense_date,
          row.source,
          row.location_name,
          row.category_name,
          row.description,
          row.amount,
          row.payment_method,
          row.status,
        ]),
      ];
      response.writeHead(200, {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition":
          'attachment; filename="coms-expenses-fixture.csv"',
      });
      return response.end(
        "\ufeff" + lines.map((line) => line.map(cell).join(",")).join("\r\n"),
      );
    }
    const recorded = rows.filter((row) => row.status === "RECORDED");
    return send(response, 200, {
      ...paginate(rows, url.searchParams),
      summary: {
        recorded_spending: total(recorded),
        operating_expenses: total(
          recorded.filter((row) => row.source === "OPERATING"),
        ),
        stock_purchases: total(
          recorded.filter((row) => row.source !== "OPERATING"),
        ),
      },
      by_location: breakdown(recorded, "branch_id", "location_name"),
      by_category: breakdown(recorded, "category_id", "category_name"),
    });
  }
  const read = route.match(
    /^\/expenses\/records\/(OPERATING|SUPPLIER_DELIVERY|DIRECT_PURCHASE)\/([^/]+)$/,
  );
  if (read && method === "GET") {
    const row = data.records.find(
      (item) => item.source === read[1] && item.id === read[2],
    );
    return send(
      response,
      row ? 200 : 404,
      row ? detail(data, row) : { message: "Expense not found" },
    );
  }
  const change = route.match(/^\/expenses\/([^/]+)(\/void)?$/);
  if (
    (route === "/expenses" && method === "POST") ||
    (change &&
      ((method === "PATCH" && !change[2]) || (method === "POST" && change[2])))
  ) {
    const key = request.headers["idempotency-key"];
    if (!uuid.test(key ?? ""))
      return send(response, 400, { message: "Idempotency-Key required" });
    const fingerprint = JSON.stringify({ method, route, body });
    if (data.keys[key])
      return send(
        response,
        data.keys[key].fingerprint === fingerprint
          ? data.keys[key].status
          : 409,
        data.keys[key].fingerprint === fingerprint
          ? detail(
              data,
              data.records.find((row) => row.id === data.keys[key].id),
            )
          : { message: "Idempotency key conflicts with the original request" },
      );
    const before = change
      ? data.records.find(
          (row) => row.id === change[1] && row.source === "OPERATING",
        )
      : null;
    if (change && !before)
      return send(response, 404, { message: "Expense not found" });
    if (
      before &&
      (before.status !== "RECORDED" || body.revision !== before.revision)
    )
      return send(response, 409, {
        message: "Expense changed. Refresh before correcting.",
      });
    if (before && !body.reason?.trim())
      return send(response, 400, { message: "Enter a reason" });
    const voiding = Boolean(change?.[2]);
    const category = data.categories.find(
      (item) => item.id === body.category_id,
    );
    const location = data.locations.find(
      (item) =>
        item.scope === body.scope &&
        item.branch_id === (body.branch_id ?? null),
    );
    if (!voiding) {
      if (
        !category ||
        (!category.is_active && before?.category_id !== category.id) ||
        !location
      )
        return send(response, 400, {
          message: "Choose an active category and location",
        });
      if (
        !/^\d{1,9}(\.\d{1,2})?$/.test(body.amount) ||
        units(body.amount) <= 0n ||
        !body.description?.trim()
      )
        return send(response, 400, {
          message: "Enter a description and positive amount",
        });
      if (
        before?.cash_movement_id &&
        [
          "scope",
          "branch_id",
          "amount",
          "payment_method",
          "cash_source",
          "cash_movement_id",
        ].some((field) =>
          field === "amount"
            ? units(body.amount) !== units(before.amount)
            : body[field] !== before[field],
        )
      )
        return send(response, 409, {
          message: "Void and recreate to change linked cash fields",
        });
      if (body.cash_source === "REGISTER") {
        const movement = data.cashOuts.find(
          (item) =>
            item.id === body.cash_movement_id &&
            item.branch_id === body.branch_id,
        );
        if (!movement || units(movement.amount) !== units(body.amount))
          return send(response, 400, {
            message: "Expense amount must match the cash out exactly",
          });
        if (
          data.records.some(
            (row) =>
              row.id !== before?.id &&
              row.status === "RECORDED" &&
              row.cash_movement_id === movement.id,
          )
        )
          return send(response, 409, { message: "Cash out is already linked" });
      }
    }
    const savedBefore = before ? clone(before) : null;
    const now = new Date().toISOString();
    const values = { ...body };
    delete values.reason;
    delete values.revision;
    const row = voiding
      ? {
          ...before,
          status: "VOIDED",
          revision: before.revision + 1,
          updated_at: now,
        }
      : {
          ...values,
          id: before?.id ?? randomUUID(),
          source: "OPERATING",
          amount: decimal(units(body.amount)),
          payee: body.payee ?? null,
          reference: body.reference ?? null,
          notes: body.notes ?? null,
          branch_id: body.branch_id ?? null,
          cash_source: body.cash_source ?? null,
          cash_movement_id: body.cash_movement_id ?? null,
          location_name: location.name,
          category_name: category.name,
          status: "RECORDED",
          revision: (before?.revision ?? 0) + 1,
          created_by_user_id: before?.created_by_user_id ?? authUser.id,
          created_by_name: before?.created_by_name ?? authUser.full_name,
          created_at: before?.created_at ?? now,
          updated_at: now,
        };
    if (before) Object.assign(before, row);
    else data.records.unshift(row);
    (data.history[row.id] ??= []).push({
      id: randomUUID(),
      action: voiding ? "VOIDED" : before ? "UPDATED" : "CREATED",
      reason: body.reason?.trim() ?? null,
      actor_name: authUser.full_name,
      created_at: now,
      before: savedBefore,
      after: clone(row),
    });
    const status = method === "PATCH" ? 200 : 201;
    data.keys[key] = { fingerprint, id: row.id, status };
    return send(response, status, detail(data, row));
  }
  return send(response, 404, { message: "No Expenses fixture route" });
}

module.exports = { handleExpensesRequest, createExpensesSeed };

async function selfTest() {
  const {
    createOperationalApiFixture,
  } = require("../operational-api-fixture.cjs");
  const secret = require("node:crypto").randomBytes(32).toString("hex");
  const fixture = await createOperationalApiFixture({ gatewaySecret: secret });
  const headers = {
    "x-coms-auth-gateway": secret,
    cookie: "coms_access=fixture-access-token",
    "content-type": "application/json",
  };
  const call = async (route, method = "GET", body, key = randomUUID()) => {
    const response = await fetch(fixture.baseUrl + route, {
      method,
      headers: { ...headers, "idempotency-key": key },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, body: await response.json() };
  };
  try {
    assert.equal((await fetch(fixture.baseUrl + "/expenses")).status, 401);
    const initial = (await call("/expenses/__fixture/state")).body;
    const list = (await call("/expenses")).body;
    assert.equal(list.total, 16);
    assert.equal(list.items.length, 10);
    assert.equal(list.summary.stock_purchases, "25.025");
    assert.deepEqual(
      (await call("/expenses?page=2")).body.summary,
      list.summary,
    );
    assert.equal(
      (await call("/expenses?source=OPERATING&search=Delivery%20fuel")).body
        .total,
      14,
    );
    assert.equal(
      (await call("/expenses?category_id=STOCK_PURCHASES")).body.total,
      2,
    );
    const cash = initial.cashOuts[0];
    const payload = {
      expense_date: today(),
      scope: "BRANCH",
      branch_id: cash.branch_id,
      category_id: initial.categories[0].id,
      description: "Fixture cash-link check",
      amount: cash.amount,
      payment_method: "CASH",
      cash_source: "REGISTER",
      cash_movement_id: cash.id,
      payee: null,
      reference: null,
      notes: null,
    };
    assert.equal(
      (await call("/expenses", "POST", { ...payload, amount: "1.00" })).status,
      400,
    );
    const key = randomUUID(),
      created = await call("/expenses", "POST", payload, key);
    assert.equal(created.status, 201);
    assert.equal(created.body.history.length, 1);
    assert.equal(
      (await call("/expenses", "POST", payload, key)).body.record.id,
      created.body.record.id,
    );
    assert.equal(
      (
        await call(
          "/expenses",
          "POST",
          { ...payload, description: "Different" },
          key,
        )
      ).status,
      409,
    );
    assert.equal((await call("/expenses", "POST", payload)).status, 409);
    assert.equal(
      (await call(`/expenses/cash-outs?branch_id=${cash.branch_id}`)).body
        .total,
      1,
    );
    const route = "/expenses/" + created.body.record.id;
    assert.equal(
      (
        await call(route, "PATCH", {
          ...payload,
          revision: 1,
          reason: "Correction",
          amount: "87.66",
        })
      ).status,
      409,
    );
    const edited = await call(route, "PATCH", {
      ...payload,
      description: "Corrected cash expense",
      revision: 1,
      reason: "Correct payee",
    });
    assert.equal(edited.status, 200);
    assert.equal(edited.body.history.length, 2);
    assert.equal(
      (
        await call(route + "/void", "POST", {
          revision: 2,
          reason: "Duplicate",
        })
      ).status,
      201,
    );
    assert.equal(
      (await call(`/expenses/cash-outs?branch_id=${cash.branch_id}`)).body
        .total,
      2,
    );
    const final = (await call("/expenses/__fixture/state")).body;
    assert.deepEqual(final.financialState, initial.financialState);
    assert.deepEqual(final.cashOuts, initial.cashOuts);
    assert.equal(
      (await call("/expenses?status=VOIDED")).body.summary.recorded_spending,
      "0",
    );
    const category = await call("/expenses/categories", "POST", {
      name: "Fixture cleaning",
    });
    assert.equal(category.status, 201);
    assert.equal(
      (
        await call("/expenses/categories", "POST", {
          name: " fixture CLEANING ",
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await call("/expenses/categories/" + category.body.id, "PATCH", {
          is_active: false,
        })
      ).body.is_active,
      false,
    );
    const source = initial.records.find(
      (row) => row.source === "SUPPLIER_DELIVERY",
    );
    assert.deepEqual(
      (await call(`/expenses/records/${source.source}/${source.id}`)).body
        .history,
      [],
    );
    assert.equal(
      (
        await call("/expenses/" + source.id, "PATCH", {
          ...payload,
          revision: 1,
          reason: "No",
        })
      ).status,
      404,
    );
    const csv = await fetch(
      fixture.baseUrl + "/expenses/export?source=OPERATING&page=2",
      { headers },
    );
    assert.equal(csv.status, 200);
    assert.match(await csv.text(), /Delivery fuel 14/);
    console.log(
      "PASS Expenses fixture: auth isolation, precise purchase totals, pagination/filtering, retries, cash amount/uniqueness, correction/void history, categories, source immutability, export and unchanged financial state.",
    );
  } finally {
    await fixture.close();
  }
}
if (require.main === module && process.argv.includes("--self-test"))
  selfTest().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
