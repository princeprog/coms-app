const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const {
  createDispatchSeed,
  dispatchListItem,
  handleDispatchRequest,
} = require("./fixtures/dispatch-fixture.cjs");
const {
  createSalesSeed,
  handleSalesRequest,
  listItem: saleListItem,
} = require("./fixtures/sales-fixture.cjs");
const {
  createDailyReportSeed,
  handleDailyReportRequest,
} = require("./fixtures/daily-reports-fixture.cjs");
const {
  createInventorySeed,
  handleInventoryRequest,
} = require("./fixtures/inventory-fixture.cjs");

const seed = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "fixtures", "operational-api.json"),
    "utf8",
  ),
);
const manilaDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Manila",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function parseCookies(header = "") {
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim().split(/=(.*)/s, 2))
      .filter(([name, value]) => name && value !== undefined),
  );
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let length = 0;
    request.on("data", (chunk) => {
      length += chunk.length;
      if (length > 1024 * 1024) {
        reject(new Error("Fixture request body exceeded 1 MB."));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      if (chunks.length === 0) return resolve(undefined);
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new Error("Fixture received invalid JSON."));
      }
    });
    request.on("error", reject);
  });
}

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

function decimalMultiply(left, right) {
  const a = decimalParts(left);
  const b = decimalParts(right);
  return decimalText(a.digits * b.digits, a.scale + b.scale);
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

function manilaBusinessDate(value) {
  const parts = manilaDateFormatter.formatToParts(new Date(value));
  const part = (type) => parts.find((entry) => entry.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function dashboardSummaryForBranch(state, branch, from, to) {
  const inPeriod = (value) => {
    const date = manilaBusinessDate(value);
    return date >= from && date <= to;
  };
  const sales = state.sales.filter((sale) => sale.branch_id === branch.id);
  const completed = sales.filter((sale) => {
    const event = sale.events.find((item) => item.event_type === "COMPLETED");
    return sale.status === "COMPLETED" && event && inPeriod(event.created_at);
  });
  const voided = sales.filter((sale) => {
    const event = sale.events.find((item) => item.event_type === "VOIDED");
    return sale.status === "VOIDED" && event && inPeriod(event.created_at);
  });
  const reports = state.dailyReports.filter(
    (report) =>
      report.branch_id === branch.id &&
      report.business_date >= from &&
      report.business_date <= to,
  );
  const dispatches = state.dispatches.filter(
    (dispatch) =>
      dispatch.branch_id === branch.id && inPeriod(dispatch.created_at),
  );

  return {
    completed_sales_amount: decimalSum(
      completed.map((sale) => sale.total_amount),
    ),
    completed_sales_count: completed.length,
    voided_sales_amount: decimalSum(voided.map((sale) => sale.total_amount)),
    voided_sales_count: voided.length,
    units_sold: decimalSum(
      completed.flatMap((sale) => sale.items.map((item) => item.quantity)),
    ),
    submitted_reports_count: reports.filter(
      (report) => report.status === "SUBMITTED",
    ).length,
    approved_reports_count: reports.filter(
      (report) => report.status === "APPROVED",
    ).length,
    open_discrepancies_count: dispatches.filter(
      (dispatch) =>
        dispatch.discrepancy && dispatch.discrepancy.status !== "RESOLVED",
    ).length,
    in_transit_dispatches_count: dispatches.filter((dispatch) =>
      ["IN_TRANSIT", "PARTIALLY_RECEIVED"].includes(dispatch.status),
    ).length,
  };
}

function dashboardResponse(state, from, to, selectedBranchId) {
  const selectedBranches = state.branches.filter(
    (branch) => !selectedBranchId || branch.id === selectedBranchId,
  );
  const branches = selectedBranches.map((branch) => ({
    branch_id: branch.id,
    branch_name: branch.branch_name,
    branch_status: branch.status,
    ...dashboardSummaryForBranch(state, branch, from, to),
  }));
  const summary = {
    completed_sales_amount: decimalSum(
      branches.map((branch) => branch.completed_sales_amount),
    ),
    completed_sales_count: branches.reduce(
      (total, branch) => total + branch.completed_sales_count,
      0,
    ),
    voided_sales_amount: decimalSum(
      branches.map((branch) => branch.voided_sales_amount),
    ),
    voided_sales_count: branches.reduce(
      (total, branch) => total + branch.voided_sales_count,
      0,
    ),
    units_sold: decimalSum(branches.map((branch) => branch.units_sold)),
    submitted_reports_count: branches.reduce(
      (total, branch) => total + branch.submitted_reports_count,
      0,
    ),
    approved_reports_count: branches.reduce(
      (total, branch) => total + branch.approved_reports_count,
      0,
    ),
    open_discrepancies_count: branches.reduce(
      (total, branch) => total + branch.open_discrepancies_count,
      0,
    ),
    in_transit_dispatches_count: branches.reduce(
      (total, branch) => total + branch.in_transit_dispatches_count,
      0,
    ),
  };
  const firstDay = Date.parse(`${from}T00:00:00.000Z`);
  const lastDay = Date.parse(`${to}T00:00:00.000Z`);
  const salesTrend = [];
  for (let day = firstDay; day <= lastDay; day += 86_400_000) {
    const date = new Date(day).toISOString().slice(0, 10);
    const dailySummaries = selectedBranches.map((branch) =>
      dashboardSummaryForBranch(state, branch, date, date),
    );
    salesTrend.push({
      date,
      completed_sales_amount: decimalSum(
        dailySummaries.map((item) => item.completed_sales_amount),
      ),
      completed_sales_count: dailySummaries.reduce(
        (total, item) => total + item.completed_sales_count,
        0,
      ),
      voided_sales_amount: decimalSum(
        dailySummaries.map((item) => item.voided_sales_amount),
      ),
      voided_sales_count: dailySummaries.reduce(
        (total, item) => total + item.voided_sales_count,
        0,
      ),
      units_sold: decimalSum(dailySummaries.map((item) => item.units_sold)),
    });
  }
  return {
    period: { from, to, time_zone: "Asia/Manila" },
    summary,
    sales_trend: salesTrend,
    branches,
  };
}

function normalizePositiveDecimal(value) {
  if (
    typeof value !== "string" ||
    value.length > 80 ||
    !/^\d+(?:\.\d+)?$/.test(value)
  ) {
    return null;
  }
  const [wholePart, fractionPart = ""] = value.split(".");
  const whole = wholePart.replace(/^0+(?=\d)/, "");
  const fraction = fractionPart.replace(/0+$/, "");
  if (whole === "0" && fraction.length === 0) return null;
  return whole + (fraction ? "." + fraction : "");
}

function stockRequestFingerprint(items) {
  return items
    .map((item) => item.stock_item_id + ":" + item.quantity_requested)
    .sort()
    .join("|");
}

function send(response, status, payload, headers = {}) {
  response.writeHead(status, {
    "cache-control": "no-store",
    ...(payload === undefined ? {} : { "content-type": "application/json" }),
    ...headers,
  });
  response.end(payload === undefined ? undefined : JSON.stringify(payload));
}

function createState({ stockItemCount = 26 } = {}) {
  const branches = Array.from({ length: 26 }, (_, index) => {
    const sequence = String(index + 1).padStart(12, "0");
    return {
      id: `10000000-0000-4000-8000-${sequence}`,
      code: `FIXTURE_${String(index + 1).padStart(2, "0")}`,
      branch_name:
        index === 0
          ? "Manila North"
          : index === 1
            ? "North Metro Commissary Branch with a deliberately long fixture name for responsive table truncation"
            : `Fixture Branch ${String(index + 1).padStart(2, "0")}`,
      address:
        index === 0
          ? "North Avenue, Quezon City"
          : `Fixture address ${String(index + 1).padStart(2, "0")}`,
      date_opened: `2024-${String((index % 12) + 1).padStart(2, "0")}-01`,
      has_dine_in: index % 2 === 0,
      status: index === 2 ? "inactive" : "active",
    };
  });
  const primaryBranchId = branches[0].id;
  const secondaryBranchId = branches[1].id;
  const staff = [
    {
      id: seed.user.id,
      email: seed.user.email,
      full_name: seed.user.full_name,
      contact_number: seed.user.contact_number,
      is_active: true,
      role_id: "2",
      role_code: "SUPER_ADMIN",
      role_name: "Super Admin",
      branch_ids: [primaryBranchId],
    },
    ...Array.from({ length: 25 }, (_, index) => {
      const sequence = String(index + 1).padStart(12, "0");
      const role = index % 2 === 0 ? seed.roles[2] : seed.roles[0];
      return {
        id: `20000000-0000-4000-8000-${sequence}`,
        email: `staff.${String(index + 1).padStart(2, "0")}@example.test`,
        full_name:
          index === 0
            ? "Alexandra With An Extremely Long Fixture Name for Responsive Table Truncation Across Small and Wide Screens"
            : `Fixture Staff ${String(index + 1).padStart(2, "0")}`,
        contact_number: `0900000${String(index + 1).padStart(4, "0")}`,
        is_active: index !== 2,
        role_id: role.id,
        role_code: role.code,
        role_name: role.role_name,
        branch_ids:
          index % 2 === 0
            ? [primaryBranchId, secondaryBranchId]
            : [primaryBranchId],
      };
    }),
  ];
  const suppliers = Array.from({ length: 26 }, (_, index) => {
    const sequence = String(index + 1).padStart(12, "0");
    return {
      id: "30000000-0000-4000-8000-" + sequence,
      supplier_name:
        index === 0
          ? "North Farm Supply"
          : index === 1
            ? "Fixture supplier with a deliberately long name for responsive table truncation"
            : "Fixture Supplier " + String(index + 1).padStart(2, "0"),
      contact_person: index === 0 ? "Morgan Lee" : null,
      contact_number: index === 0 ? "09170000001" : null,
      email: index === 0 ? "north-farm@example.test" : null,
      address: index === 0 ? "North Avenue, Quezon City" : null,
      is_active: index !== 2,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };
  });
  const stockItems = Array.from({ length: stockItemCount }, (_, index) => {
    const sequence = String(index + 1).padStart(12, "0");
    return {
      id: "31000000-0000-4000-8000-" + sequence,
      stock_item_name:
        index === 0
          ? "Flour"
          : index === 1
            ? "Fixture stock item with a deliberately long name for responsive selection"
            : "Fixture Stock Item " + String(index + 1).padStart(2, "0"),
      category: index % 2 === 0 ? "Dry goods" : "Produce",
      unit: index % 2 === 0 ? "kg" : "piece",
      is_active: index !== 2,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };
  });
  const products = Array.from({ length: 31 }, (_, index) => {
    const sequence = String(index + 1).padStart(12, "0");
    return {
      id: "35000000-0000-4000-8000-" + sequence,
      product_name:
        index === 0
          ? "Chicken sandwich"
          : index === 1
            ? "Fixture product with a deliberately long name for responsive table truncation across every viewport"
            : "Fixture Product " + String(index + 1).padStart(2, "0"),
      description: index === 0 ? "Grilled chicken on sourdough" : null,
      is_active: index !== 2,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };
  });
  products[30].product_name = "Fixture Product 31";
  const branchProducts = products.slice(0, 26).map((product, index) => ({
    branch_id: primaryBranchId,
    branch_name: branches[0].branch_name,
    product_id: product.id,
    product_name: product.product_name,
    description: product.description,
    product_is_active: product.is_active,
    price: String(100 + index) + ".0000",
    is_available: index % 2 === 0,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  }));
  const recipes = [
    {
      product_id: products[0].id,
      items: [
        {
          stock_item_id: stockItems[0].id,
          quantity_required: "0.0250",
        },
        {
          stock_item_id: stockItems[2].id,
          quantity_required: "0.500",
        },
      ],
    },
  ];
  const sales = createSalesSeed({ branches, products, branchProducts, seed });
  const receipts = Array.from({ length: 26 }, (_, index) => {
    const sequence = String(index + 1).padStart(12, "0");
    const status = index % 4 === 0 ? "DRAFT" : "POSTED";
    const supplier = suppliers[index % suppliers.length];
    const lines = [
      {
        id:
          "50000000-0000-4000-8000-" + String(index * 2 + 1).padStart(12, "0"),
        stock_item_id: stockItems[0].id,
        stock_item_name: stockItems[0].stock_item_name,
        unit: stockItems[0].unit,
        quantity_received: "12.5",
        unit_cost: "2.50",
        line_total: "31.25",
      },
      {
        id:
          "50000000-0000-4000-8000-" + String(index * 2 + 2).padStart(12, "0"),
        stock_item_id: stockItems[1].id,
        stock_item_name: stockItems[1].stock_item_name,
        unit: stockItems[1].unit,
        quantity_received: "20",
        unit_cost: "4.86",
        line_total: "97.20",
      },
    ];
    return {
      id: "32000000-0000-4000-8000-" + sequence,
      supplier_id: supplier.id,
      supplier_name: supplier.supplier_name,
      received_at: "2026-09-" + String((index % 26) + 1).padStart(2, "0"),
      status,
      idempotency_key: "40000000-0000-4000-8000-" + sequence,
      created_by_user_id: seed.user.id,
      posted_by_user_id: status === "POSTED" ? seed.user.id : null,
      posted_at: status === "POSTED" ? "2026-09-25T01:30:00.000Z" : null,
      created_at: "2026-09-25T01:00:00.000Z",
      updated_at: "2026-09-25T01:30:00.000Z",
      total_cost: "128.45",
      item_count: lines.length,
      items: lines,
    };
  });
  const stockRequests = Array.from({ length: 30 }, (_, index) => {
    const sequence = String(index + 1).padStart(12, "0");
    const branch =
      index >= 26 ? branches[0] : branches[index % branches.length];
    const status =
      index === 0 || index === 4
        ? "PENDING"
        : index === 1 || index >= 5
          ? "APPROVED"
          : index === 2
            ? "REJECTED"
            : "CANCELLED";
    const items = [
      {
        id:
          "52000000-0000-4000-8000-" + String(index * 2 + 1).padStart(12, "0"),
        stock_item_id: stockItems[0].id,
        stock_item_name: stockItems[0].stock_item_name,
        unit: stockItems[0].unit,
        quantity_requested: "12.5000",
        created_at: "2026-09-25T01:00:00.000Z",
      },
      {
        id:
          "52000000-0000-4000-8000-" + String(index * 2 + 2).padStart(12, "0"),
        stock_item_id: stockItems[1].id,
        stock_item_name: stockItems[1].stock_item_name,
        unit: stockItems[1].unit,
        quantity_requested: "2.75",
        created_at: "2026-09-25T01:00:00.000Z",
      },
    ];
    const events = [
      {
        id:
          "53000000-0000-4000-8000-" + String(index * 2 + 1).padStart(12, "0"),
        event_type: "SUBMITTED",
        actor_user_id: seed.user.id,
        actor_name: index === 0 ? "Branch Manager" : "Fixture Requester",
        created_at: "2026-09-25T01:00:00.000Z",
      },
    ];
    if (status !== "PENDING") {
      events.push({
        id:
          "53000000-0000-4000-8000-" + String(index * 2 + 2).padStart(12, "0"),
        event_type: status,
        actor_user_id: seed.user.id,
        actor_name: "Fixture Operations Lead",
        created_at: "2026-09-25T02:00:00.000Z",
      });
    }
    return {
      id: "33000000-0000-4000-8000-" + sequence,
      branch_id: branch.id,
      branch_name: branch.branch_name,
      requested_by_user_id: seed.user.id,
      requester_name:
        index === 0
          ? "Branch Manager"
          : "Fixture Requester " + sequence.slice(-2),
      status,
      created_at: "2026-09-25T01:00:00.000Z",
      updated_at:
        status === "PENDING"
          ? "2026-09-25T01:00:00.000Z"
          : "2026-09-25T02:00:00.000Z",
      item_count: items.length,
      items,
      events,
    };
  });
  return {
    roles: clone(seed.roles),
    branches,
    staff,
    suppliers,
    stockItems,
    products,
    branchProducts,
    recipes,
    receipts,
    stockRequests,
    dispatches: createDispatchSeed(stockRequests, seed),
    dispatchActionKeys: [],
    sales,
    saleActionKeys: [],
    dailyReports: createDailyReportSeed({ branches, stockItems, seed }),
    dailyReportActionKeys: [],
    dailyReportEventSequence: 0,
    fixtureUserId: seed.user.id,
    ...createInventorySeed({ branches, stockItems, seed }),
    failNext: null,
  };
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

function isNonnegativeDecimal(value) {
  return (
    typeof value === "string" &&
    value.length <= 80 &&
    /^\d+(?:\.\d+)?$/.test(value)
  );
}

function recipeDetails(state, product) {
  const savedRecipe = state.recipes.find(
    (recipe) => recipe.product_id === product.id,
  );
  const timestamp = "2026-09-25T03:00:00.000Z";
  return {
    product: {
      id: product.id,
      product_name: product.product_name,
      description: product.description,
      is_active: product.is_active,
    },
    items: (savedRecipe?.items ?? []).map((item) => {
      const stockItem = state.stockItems.find(
        (candidate) => candidate.id === item.stock_item_id,
      );
      return {
        product_id: product.id,
        stock_item_id: item.stock_item_id,
        stock_item_name: stockItem.stock_item_name,
        unit: stockItem.unit,
        stock_item_is_active: stockItem.is_active,
        quantity_required: item.quantity_required,
        created_at: item.created_at ?? timestamp,
        updated_at: item.updated_at ?? timestamp,
      };
    }),
  };
}

function branchProductRecord(branch, product, price, isAvailable, timestamp) {
  return {
    branch_id: branch.id,
    branch_name: branch.branch_name,
    product_id: product.id,
    product_name: product.product_name,
    description: product.description,
    product_is_active: product.is_active,
    price,
    is_available: isAvailable,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

function branchProductView(state, offer) {
  const branch = state.branches.find((item) => item.id === offer.branch_id);
  const product = state.products.find((item) => item.id === offer.product_id);
  return {
    branch_id: offer.branch_id,
    branch_name: branch.branch_name,
    product_id: offer.product_id,
    product_name: product.product_name,
    description: product.description,
    product_is_active: product.is_active,
    price: offer.price,
    is_available: offer.is_available,
    created_at: offer.created_at,
    updated_at: offer.updated_at,
  };
}

function createOperationalApiFixture({
  gatewaySecret,
  authUser = seed.user,
  stockItemCount = 26,
}) {
  if (!gatewaySecret || !/^[a-f0-9]{64}$/i.test(gatewaySecret)) {
    throw new Error(
      "The operational fixture requires a generated gateway secret.",
    );
  }

  let state = createState({ stockItemCount });
  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");

    try {
      const body = await readJson(request);

      if (url.pathname === "/__fixture/reset" && request.method === "POST") {
        state = createState({ stockItemCount });
        return send(response, 204);
      }
      if (
        url.pathname === "/__fixture/fail-next" &&
        request.method === "POST"
      ) {
        if (
          !body ||
          typeof body.method !== "string" ||
          typeof body.path !== "string" ||
          !Number.isInteger(body.status) ||
          typeof body.message !== "string"
        ) {
          return send(response, 400, {
            message: "Invalid fixture failure rule.",
          });
        }
        state.failNext = body;
        return send(response, 204);
      }
      if (url.pathname === "/__fixture/state" && request.method === "GET") {
        return send(response, 200, {
          roles: state.roles,
          branches: state.branches,
          staff: state.staff,
          suppliers: state.suppliers,
          stockItems: state.stockItems,
          products: state.products,
          branchProducts: state.branchProducts,
          recipes: state.recipes,
          receipts: state.receipts,
          stockRequests: state.stockRequests,
          dispatches: state.dispatches.map(dispatchListItem),
          sales: state.sales.map(saleListItem),
          dailyReports: state.dailyReports.map((report) => ({
            id: report.id,
            branch_id: report.branch_id,
            business_date: report.business_date,
            status: report.status,
          })),
        });
      }

      if (request.headers["x-coms-auth-gateway"] !== gatewaySecret) {
        return send(response, 401, { message: "Invalid fixture gateway." });
      }

      if (
        state.failNext?.method === request.method &&
        state.failNext.path === url.pathname
      ) {
        const failure = state.failNext;
        state.failNext = null;
        return send(response, failure.status, { message: failure.message });
      }

      const cookies = parseCookies(request.headers.cookie);
      const isAuthenticated = cookies.coms_access === "fixture-access-token";
      const hasRefreshCookie = cookies.coms_refresh === "fixture-refresh-token";
      const userResponse = clone(authUser);

      if (url.pathname === "/auth/login" && request.method === "POST") {
        if (
          body?.email?.toLowerCase() !== authUser.email.toLowerCase() ||
          body?.password !== seed.login.password
        ) {
          return send(response, 401, { message: "Invalid email or password." });
        }
        return send(
          response,
          200,
          { user: userResponse },
          {
            "set-cookie": [
              "coms_access=fixture-access-token; HttpOnly; Path=/; SameSite=Lax; Max-Age=3600",
              "coms_refresh=fixture-refresh-token; HttpOnly; Path=/; SameSite=Lax; Max-Age=2592000",
            ],
          },
        );
      }

      if (url.pathname === "/auth/me" && request.method === "GET") {
        if (!isAuthenticated) {
          return send(response, 401, { message: "Unauthorized." });
        }
        return send(response, 200, {
          user: userResponse,
          role: userResponse.role,
          permissions: userResponse.permissions,
          branch_ids: userResponse.branch_ids,
        });
      }

      if (url.pathname === "/auth/refresh" && request.method === "POST") {
        if (!hasRefreshCookie) {
          return send(response, 401, { message: "Refresh session expired." });
        }
        return send(
          response,
          200,
          { user: userResponse },
          {
            "set-cookie": [
              "coms_access=fixture-access-token; HttpOnly; Path=/; SameSite=Lax; Max-Age=3600",
              "coms_refresh=fixture-refresh-token; HttpOnly; Path=/; SameSite=Lax; Max-Age=2592000",
            ],
          },
        );
      }

      if (url.pathname === "/auth/logout" && request.method === "POST") {
        return send(response, 204, undefined, {
          "set-cookie": [
            "coms_access=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0",
            "coms_refresh=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0",
          ],
        });
      }

      if (!isAuthenticated) {
        return send(response, 401, { message: "Unauthorized." });
      }

      const salesResponse = handleSalesRequest({
        request,
        response,
        url,
        body,
        state,
        seed,
      });
      if (salesResponse !== false) return salesResponse;

      const dispatchResponse = handleDispatchRequest({
        request,
        response,
        url,
        body,
        state,
        seed,
      });
      if (dispatchResponse !== false) return dispatchResponse;

      const dailyReportResponse = handleDailyReportRequest({
        request,
        response,
        url,
        body,
        state,
        seed,
      });
      if (dailyReportResponse !== false) return dailyReportResponse;

      const inventoryResponse = handleInventoryRequest({
        request,
        response,
        url,
        body,
        state,
        seed,
      });
      if (inventoryResponse !== false) return inventoryResponse;

      const dashboardBranchRoute = url.pathname.match(
        /^\/branches\/([0-9a-f-]{36})\/dashboard$/i,
      );
      if (
        request.method === "GET" &&
        (url.pathname === "/dashboard/overview" || dashboardBranchRoute)
      ) {
        const from = url.searchParams.get("from");
        const to = url.searchParams.get("to");
        if (
          !from ||
          !to ||
          !/^\d{4}-\d{2}-\d{2}$/.test(from) ||
          !/^\d{4}-\d{2}-\d{2}$/.test(to) ||
          from > to
        ) {
          return send(response, 400, { message: "Invalid dashboard period." });
        }
        if (dashboardBranchRoute) {
          const branch = state.branches.find(
            (item) => item.id === dashboardBranchRoute[1],
          );
          if (!branch)
            return send(response, 404, { message: "Branch not found." });
          return send(
            response,
            200,
            dashboardResponse(state, from, to, branch.id),
          );
        }
        return send(
          response,
          200,
          dashboardResponse(
            state,
            from,
            to,
            url.searchParams.get("branch_id") ?? undefined,
          ),
        );
      }

      if (url.pathname === "/products" && request.method === "GET") {
        const search = (url.searchParams.get("search") ?? "")
          .trim()
          .toLowerCase();
        const activeFilter = url.searchParams.get("is_active");
        const matches = state.products.filter((product) => {
          if (activeFilter === "true" && !product.is_active) return false;
          if (activeFilter === "false" && product.is_active) return false;
          return !search || product.product_name.toLowerCase().includes(search);
        });
        matches.sort(
          (left, right) =>
            left.product_name.localeCompare(right.product_name) ||
            left.id.localeCompare(right.id),
        );
        return send(response, 200, pageItems(matches, url));
      }
      if (url.pathname === "/products" && request.method === "POST") {
        if (
          typeof body?.product_name !== "string" ||
          body.product_name.trim().length < 2 ||
          body.product_name.length > 160 ||
          (body.description !== undefined &&
            body.description !== null &&
            (typeof body.description !== "string" ||
              body.description.length > 1000))
        ) {
          return send(response, 400, { message: "Invalid fixture product." });
        }
        const sequence = String(state.products.length + 1).padStart(12, "0");
        const now = "2026-09-25T03:00:00.000Z";
        const product = {
          id: "35000000-0000-4000-8000-" + sequence,
          product_name: body.product_name.trim(),
          description: body.description?.trim() || null,
          is_active: true,
          created_at: now,
          updated_at: now,
        };
        state.products.push(product);
        return send(response, 201, product);
      }

      const recipeRoute = url.pathname.match(
        /^\/products\/([0-9a-f-]{36})\/recipe$/i,
      );
      if (recipeRoute) {
        const product = state.products.find(
          (item) => item.id === recipeRoute[1],
        );
        if (!product)
          return send(response, 404, { message: "Product not found." });
        if (request.method === "GET") {
          return send(response, 200, recipeDetails(state, product));
        }
        if (request.method === "POST" || request.method === "PUT") {
          if (!product.is_active) {
            return send(response, 409, {
              message: "Inactive products cannot have recipes.",
            });
          }
          if (
            !Array.isArray(body?.items) ||
            body.items.length < 1 ||
            body.items.length > 100
          ) {
            return send(response, 400, { message: "Invalid fixture recipe." });
          }
          const ids = new Set();
          const items = [];
          for (const item of body.items) {
            if (
              !item ||
              typeof item.stock_item_id !== "string" ||
              normalizePositiveDecimal(item.quantity_required) === null ||
              ids.has(item.stock_item_id)
            ) {
              return send(response, 400, {
                message: "Invalid or duplicate recipe ingredient.",
              });
            }
            ids.add(item.stock_item_id);
            const stockItem = state.stockItems.find(
              (candidate) => candidate.id === item.stock_item_id,
            );
            if (!stockItem || !stockItem.is_active) {
              return send(response, 404, {
                message: "Active stock item not found.",
              });
            }
            items.push({
              stock_item_id: item.stock_item_id,
              quantity_required: item.quantity_required,
              created_at: "2026-09-25T03:00:00.000Z",
              updated_at: "2026-09-25T03:00:00.000Z",
            });
          }
          const recipeIndex = state.recipes.findIndex(
            (recipe) => recipe.product_id === product.id,
          );
          if (request.method === "POST" && recipeIndex >= 0) {
            return send(response, 409, {
              message: "A recipe already exists for this product.",
            });
          }
          if (request.method === "PUT" && recipeIndex < 0) {
            return send(response, 409, {
              message: "A recipe must exist before it can be updated.",
            });
          }
          const recipe = { product_id: product.id, items };
          if (recipeIndex >= 0) state.recipes[recipeIndex] = recipe;
          else state.recipes.push(recipe);
          return send(
            response,
            request.method === "POST" ? 201 : 200,
            recipeDetails(state, product),
          );
        }
      }

      const productRoute = url.pathname.match(
        /^\/products\/([0-9a-f-]{36})(?:\/(deactivate))?$/i,
      );
      if (productRoute) {
        const product = state.products.find(
          (item) => item.id === productRoute[1],
        );
        if (!product)
          return send(response, 404, { message: "Product not found." });
        if (request.method === "PATCH" && !productRoute[2]) {
          if (
            body?.product_name !== undefined &&
            (typeof body.product_name !== "string" ||
              body.product_name.trim().length < 2 ||
              body.product_name.length > 160)
          ) {
            return send(response, 400, { message: "Invalid product name." });
          }
          if (
            body?.description !== undefined &&
            body.description !== null &&
            (typeof body.description !== "string" ||
              body.description.length > 1000)
          ) {
            return send(response, 400, { message: "Invalid description." });
          }
          if (body.product_name !== undefined)
            product.product_name = body.product_name.trim();
          if (Object.hasOwn(body, "description"))
            product.description = body.description?.trim() || null;
          product.updated_at = "2026-09-25T03:00:00.000Z";
          return send(response, 200, product);
        }
        if (request.method === "POST" && productRoute[2] === "deactivate") {
          product.is_active = false;
          product.updated_at = "2026-09-25T03:00:00.000Z";
          return send(response, 200, product);
        }
      }

      const branchProductsRoute = url.pathname.match(
        /^\/branches\/([0-9a-f-]{36})\/products(?:\/([0-9a-f-]{36})(?:\/(availability))?)?$/i,
      );
      if (branchProductsRoute) {
        const branch = state.branches.find(
          (item) => item.id === branchProductsRoute[1],
        );
        if (!branch)
          return send(response, 404, { message: "Branch not found." });
        if (!branchProductsRoute[2] && request.method === "GET") {
          const search = (url.searchParams.get("search") ?? "")
            .trim()
            .toLowerCase();
          const availability = url.searchParams.get("is_available");
          const matches = state.branchProducts
            .filter((offer) => offer.branch_id === branch.id)
            .map((offer) => ({
              offer,
              product: state.products.find(
                (item) => item.id === offer.product_id,
              ),
            }))
            .filter(({ offer, product }) => {
              if (!product) return false;
              if (availability === "true" && !offer.is_available) return false;
              if (availability === "false" && offer.is_available) return false;
              return (
                !search || product.product_name.toLowerCase().includes(search)
              );
            })
            .map(({ offer }) => branchProductView(state, offer));
          matches.sort(
            (left, right) =>
              left.product_name.localeCompare(right.product_name) ||
              left.product_id.localeCompare(right.product_id),
          );
          return send(response, 200, pageItems(matches, url));
        }
        if (branch.status !== "active") {
          return send(response, 404, {
            message: "Active branch not found.",
          });
        }
        if (!branchProductsRoute[2] && request.method === "POST") {
          if (
            typeof body?.product_id !== "string" ||
            !isNonnegativeDecimal(body.price)
          ) {
            return send(response, 400, { message: "Invalid branch offer." });
          }
          const product = state.products.find(
            (item) => item.id === body.product_id,
          );
          if (!product || !product.is_active) {
            return send(response, 404, {
              message: "Active product not found.",
            });
          }
          if (
            state.branchProducts.some(
              (offer) =>
                offer.branch_id === branch.id &&
                offer.product_id === product.id,
            )
          ) {
            return send(response, 409, {
              message: "Product is already offered at this branch.",
            });
          }
          const now = "2026-09-25T03:00:00.000Z";
          const offer = branchProductRecord(
            branch,
            product,
            body.price,
            true,
            now,
          );
          state.branchProducts.push(offer);
          return send(response, 201, offer);
        }
        if (branchProductsRoute[2]) {
          const offer = state.branchProducts.find(
            (item) =>
              item.branch_id === branch.id &&
              item.product_id === branchProductsRoute[2],
          );
          if (!offer)
            return send(response, 404, { message: "Offer not found." });
          const product = state.products.find(
            (item) => item.id === offer.product_id,
          );
          if (
            !product?.is_active &&
            !(request.method === "POST" && body?.is_available === false)
          ) {
            return send(response, 409, {
              message: "Inactive products cannot be changed.",
            });
          }
          if (
            request.method === "PATCH" &&
            !branchProductsRoute[3] &&
            isNonnegativeDecimal(body?.price)
          ) {
            offer.price = body.price;
            offer.updated_at = "2026-09-25T03:00:00.000Z";
            return send(response, 200, branchProductView(state, offer));
          }
          if (
            request.method === "POST" &&
            branchProductsRoute[3] === "availability" &&
            typeof body?.is_available === "boolean"
          ) {
            offer.is_available = body.is_available;
            offer.updated_at = "2026-09-25T03:00:00.000Z";
            return send(response, 200, branchProductView(state, offer));
          }
          return send(response, 400, { message: "Invalid offer update." });
        }
      }

      if (
        (url.pathname === "/suppliers" || url.pathname === "/stock-items") &&
        request.method === "GET"
      ) {
        const collection =
          url.pathname === "/suppliers" ? state.suppliers : state.stockItems;
        const nameKey =
          url.pathname === "/suppliers" ? "supplier_name" : "stock_item_name";
        const search = (url.searchParams.get("search") ?? "")
          .trim()
          .toLowerCase();
        const activeFilter = url.searchParams.get("is_active");
        const matches = collection.filter((item) => {
          if (activeFilter === "true" && !item.is_active) return false;
          if (activeFilter === "false" && item.is_active) return false;
          return !search || item[nameKey].toLowerCase().includes(search);
        });
        const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
        const pageSize = Math.min(
          100,
          Math.max(1, Number(url.searchParams.get("page_size")) || 25),
        );
        const start = (page - 1) * pageSize;
        return send(response, 200, {
          items: matches.slice(start, start + pageSize),
          total: matches.length,
          page,
          page_size: pageSize,
        });
      }

      if (url.pathname === "/supplier-receipts" && request.method === "GET") {
        const search = (url.searchParams.get("search") ?? "")
          .trim()
          .toLowerCase();
        const status = url.searchParams.get("status");
        const matches = state.receipts.filter((receipt) => {
          if (status && receipt.status !== status) return false;
          return (
            !search || receipt.supplier_name.toLowerCase().includes(search)
          );
        });
        const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
        const pageSize = Math.min(
          100,
          Math.max(1, Number(url.searchParams.get("page_size")) || 25),
        );
        const start = (page - 1) * pageSize;
        return send(response, 200, {
          items: matches.slice(start, start + pageSize).map((receipt) => {
            const listItem = { ...receipt };
            delete listItem.items;
            return listItem;
          }),
          total: matches.length,
          page,
          page_size: pageSize,
        });
      }
      if (url.pathname === "/supplier-receipts" && request.method === "POST") {
        if (
          !body ||
          typeof body.supplier_id !== "string" ||
          !Array.isArray(body.items) ||
          body.items.length === 0
        ) {
          return send(response, 400, { message: "Invalid fixture receipt." });
        }
        const idempotencyKey = request.headers["idempotency-key"];
        if (typeof idempotencyKey !== "string") {
          return send(response, 400, { message: "Missing idempotency key." });
        }
        const retry = state.receipts.find(
          (receipt) => receipt.idempotency_key === idempotencyKey,
        );
        if (retry) return send(response, 201, retry);
        const supplier = state.suppliers.find(
          (item) => item.id === body.supplier_id,
        );
        if (!supplier || !supplier.is_active) {
          return send(response, 404, { message: "Supplier not found." });
        }
        const items = body.items.map((line, index) => {
          const stockItem = state.stockItems.find(
            (item) => item.id === line.stock_item_id,
          );
          if (!stockItem || !stockItem.is_active) return null;
          return {
            id:
              "51000000-0000-4000-8000-" +
              String(state.receipts.length * 100 + index + 1).padStart(12, "0"),
            stock_item_id: stockItem.id,
            stock_item_name: stockItem.stock_item_name,
            unit: stockItem.unit,
            quantity_received: String(line.quantity_received),
            unit_cost: String(line.unit_cost),
            line_total: decimalMultiply(line.quantity_received, line.unit_cost),
          };
        });
        if (items.some((item) => item === null)) {
          return send(response, 404, { message: "Stock item not found." });
        }
        const sequence = String(state.receipts.length + 1).padStart(12, "0");
        const now = "2026-09-25T02:00:00.000Z";
        const receipt = {
          id: "32000000-0000-4000-8000-" + sequence,
          supplier_id: supplier.id,
          supplier_name: supplier.supplier_name,
          received_at: body.received_at,
          status: "DRAFT",
          idempotency_key: idempotencyKey,
          created_by_user_id: seed.user.id,
          posted_by_user_id: null,
          posted_at: null,
          created_at: now,
          updated_at: now,
          total_cost: decimalSum(items.map((item) => item.line_total)),
          item_count: items.length,
          items,
        };
        state.receipts.push(receipt);
        return send(response, 201, receipt);
      }
      const receiptRoute = url.pathname.match(
        /^\/supplier-receipts\/([0-9a-f-]{36})(?:\/(post))?$/i,
      );
      if (receiptRoute && request.method === "GET" && !receiptRoute[2]) {
        const receipt = state.receipts.find(
          (item) => item.id === receiptRoute[1],
        );
        if (!receipt) {
          return send(response, 404, {
            message: "Supplier receipt not found.",
          });
        }
        return send(response, 200, receipt);
      }
      if (
        receiptRoute &&
        request.method === "POST" &&
        receiptRoute[2] === "post"
      ) {
        const receipt = state.receipts.find(
          (item) => item.id === receiptRoute[1],
        );
        if (!receipt) {
          return send(response, 404, {
            message: "Supplier receipt not found.",
          });
        }
        if (receipt.status !== "POSTED") {
          receipt.status = "POSTED";
          receipt.posted_by_user_id = seed.user.id;
          receipt.posted_at = "2026-09-25T02:30:00.000Z";
          receipt.updated_at = receipt.posted_at;
        }
        return send(response, 200, receipt);
      }

      if (url.pathname === "/stock-requests" && request.method === "GET") {
        const status = url.searchParams.get("status");
        const branchId = url.searchParams.get("branch_id");
        const matches = state.stockRequests.filter((stockRequest) => {
          if (status && stockRequest.status !== status) return false;
          return !branchId || stockRequest.branch_id === branchId;
        });
        const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
        const pageSize = Math.min(
          100,
          Math.max(1, Number(url.searchParams.get("page_size")) || 25),
        );
        const start = (page - 1) * pageSize;
        return send(response, 200, {
          items: matches.slice(start, start + pageSize).map((stockRequest) => {
            const listItem = { ...stockRequest };
            delete listItem.items;
            delete listItem.events;
            return listItem;
          }),
          total: matches.length,
          page,
          page_size: pageSize,
        });
      }
      if (url.pathname === "/stock-requests" && request.method === "POST") {
        if (
          !body ||
          typeof body.branch_id !== "string" ||
          !Array.isArray(body.items) ||
          body.items.length === 0 ||
          body.items.length > 100
        ) {
          return send(response, 400, { message: "Invalid fixture request." });
        }
        const idempotencyKey = request.headers["idempotency-key"];
        if (
          typeof idempotencyKey !== "string" ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            idempotencyKey,
          )
        ) {
          return send(response, 400, { message: "Missing idempotency key." });
        }
        const seenStockItems = new Set();
        const normalizedItems = [];
        for (const line of body.items) {
          const quantity = normalizePositiveDecimal(line?.quantity_requested);
          if (
            typeof line?.stock_item_id !== "string" ||
            quantity === null ||
            seenStockItems.has(line.stock_item_id)
          ) {
            return send(response, 400, {
              message: "Choose unique stock items and positive quantities.",
            });
          }
          seenStockItems.add(line.stock_item_id);
          normalizedItems.push({
            stock_item_id: line.stock_item_id,
            quantity_requested: quantity,
          });
        }
        const retry = state.stockRequests.find(
          (stockRequest) => stockRequest.idempotency_key === idempotencyKey,
        );
        if (retry) {
          const sameRequest =
            retry.branch_id === body.branch_id &&
            retry.requested_by_user_id === seed.user.id &&
            stockRequestFingerprint(retry.items) ===
              stockRequestFingerprint(normalizedItems);
          if (!sameRequest) {
            return send(response, 409, {
              message: "Idempotency key was already used for another request.",
            });
          }
          return send(response, 201, retry);
        }
        const branch = state.branches.find(
          (item) => item.id === body.branch_id && item.status === "active",
        );
        if (!branch) {
          return send(response, 404, { message: "Branch not found." });
        }
        const items = normalizedItems.map((line, index) => {
          const stockItem = state.stockItems.find(
            (item) => item.id === line.stock_item_id && item.is_active,
          );
          if (!stockItem) return null;
          return {
            id:
              "54000000-0000-4000-8000-" +
              String(state.stockRequests.length * 100 + index + 1).padStart(
                12,
                "0",
              ),
            stock_item_id: stockItem.id,
            stock_item_name: stockItem.stock_item_name,
            unit: stockItem.unit,
            quantity_requested: line.quantity_requested,
            created_at: "2026-09-25T03:00:00.000Z",
          };
        });
        if (items.some((item) => item === null)) {
          return send(response, 400, {
            message: "Choose unique active stock items.",
          });
        }
        const sequence = String(state.stockRequests.length + 1).padStart(
          12,
          "0",
        );
        const submittedAt = "2026-09-25T03:00:00.000Z";
        const stockRequest = {
          id: "33000000-0000-4000-8000-" + sequence,
          branch_id: branch.id,
          branch_name: branch.branch_name,
          requested_by_user_id: seed.user.id,
          requester_name: "Fixture Branch Manager",
          status: "PENDING",
          created_at: submittedAt,
          updated_at: submittedAt,
          item_count: items.length,
          items,
          events: [
            {
              id:
                "55000000-0000-4000-8000-" +
                String(state.stockRequests.length + 1).padStart(12, "0"),
              event_type: "SUBMITTED",
              actor_user_id: seed.user.id,
              actor_name: "Fixture Branch Manager",
              created_at: submittedAt,
            },
          ],
          idempotency_key: idempotencyKey,
        };
        state.stockRequests.push(stockRequest);
        return send(response, 201, stockRequest);
      }
      const stockRequestRoute = url.pathname.match(
        /^\/stock-requests\/([0-9a-f-]{36})(?:\/(approve|reject|cancel))?$/i,
      );
      if (
        stockRequestRoute &&
        request.method === "GET" &&
        !stockRequestRoute[2]
      ) {
        const stockRequest = state.stockRequests.find(
          (item) => item.id === stockRequestRoute[1],
        );
        if (!stockRequest) {
          return send(response, 404, { message: "Stock request not found." });
        }
        return send(response, 200, stockRequest);
      }
      if (
        stockRequestRoute &&
        request.method === "POST" &&
        stockRequestRoute[2]
      ) {
        const stockRequest = state.stockRequests.find(
          (item) => item.id === stockRequestRoute[1],
        );
        if (!stockRequest) {
          return send(response, 404, { message: "Stock request not found." });
        }
        if (stockRequest.status !== "PENDING") {
          return send(response, 409, {
            message: "Request is no longer pending.",
          });
        }
        const statusByAction = {
          approve: "APPROVED",
          reject: "REJECTED",
          cancel: "CANCELLED",
        };
        const nextStatus = statusByAction[stockRequestRoute[2]];
        const updatedAt = "2026-09-25T04:00:00.000Z";
        stockRequest.status = nextStatus;
        stockRequest.updated_at = updatedAt;
        const requestSequence = Number(stockRequest.id.slice(-12));
        stockRequest.events.push({
          id:
            "55000000-0000-4000-8000-" +
            String(
              requestSequence * 100 + stockRequest.events.length + 1,
            ).padStart(12, "0"),
          event_type: nextStatus,
          actor_user_id: seed.user.id,
          actor_name: "Fixture Operations Lead",
          created_at: updatedAt,
        });
        return send(response, 200, stockRequest);
      }

      if (url.pathname === "/roles" && request.method === "GET") {
        return send(response, 200, state.roles);
      }
      if (url.pathname === "/roles/permissions" && request.method === "GET") {
        return send(response, 200, seed.permissions);
      }
      if (url.pathname === "/branches" && request.method === "GET") {
        const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
        const pageSize = Math.min(
          100,
          Math.max(1, Number(url.searchParams.get("page_size")) || 25),
        );
        const start = (page - 1) * pageSize;
        return send(response, 200, {
          items: state.branches.slice(start, start + pageSize),
          total: state.branches.length,
          page,
          page_size: pageSize,
        });
      }
      if (url.pathname === "/branches" && request.method === "POST") {
        if (body?.code !== undefined) {
          return send(response, 400, {
            message: "Branch code is system assigned.",
          });
        }
        const sequence = String(state.branches.length + 1).padStart(12, "0");
        const id = `10000000-0000-4000-8000-${sequence}`;
        const branch = {
          id,
          code: `BR-${sequence.padStart(16, "0")}`,
          branch_name: body.branch_name,
          address: body.address ?? null,
          date_opened: body.date_opened ?? null,
          has_dine_in: body.has_dine_in,
          status: "active",
        };
        state.branches.push(branch);
        return send(response, 201, branch);
      }

      if (url.pathname === "/staff" && request.method === "GET") {
        const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
        const pageSize = Math.min(
          100,
          Math.max(1, Number(url.searchParams.get("page_size")) || 25),
        );
        const branchId = url.searchParams.get("branch_id");
        const status = url.searchParams.get("status");
        const search = (url.searchParams.get("search") ?? "")
          .trim()
          .toLowerCase();
        const matches = state.staff.filter((member) => {
          if (branchId && !member.branch_ids.includes(branchId)) return false;
          if (status === "active" && !member.is_active) return false;
          if (status === "inactive" && member.is_active) return false;
          if (status === "unassigned" && member.role_id !== null) return false;
          if (!search) return true;
          return [member.full_name, member.email, member.contact_number].some(
            (value) => value.toLowerCase().includes(search),
          );
        });
        const start = (page - 1) * pageSize;
        return send(response, 200, {
          items: matches.slice(start, start + pageSize),
          total: matches.length,
          page,
          page_size: pageSize,
        });
      }
      if (url.pathname === "/staff" && request.method === "POST") {
        if (
          state.staff.some(
            (member) =>
              member.email.toLowerCase() === body?.email?.toLowerCase(),
          )
        ) {
          return send(response, 409, {
            message: "A staff account with that email already exists.",
          });
        }
        const role =
          body?.role_id == null
            ? null
            : state.roles.find((item) => item.id === String(body.role_id));
        if (body?.role_id != null && (!role || role.code === "SUPER_ADMIN")) {
          return send(response, 400, { message: "Invalid staff role." });
        }
        const sequence = String(state.staff.length + 1).padStart(12, "0");
        const id = `20000000-0000-4000-8000-${sequence}`;
        state.staff.push({
          id,
          email: body.email,
          full_name: body.full_name,
          contact_number: body.contact_number,
          is_active: true,
          role_id: role?.id ?? null,
          role_code: role?.code ?? null,
          role_name: role?.role_name ?? null,
          branch_ids: body.branch_ids,
        });
        return send(response, 201, { id });
      }
      const staffRoute = url.pathname.match(
        /^\/staff\/([0-9a-f-]{36})(?:\/(role|branches|deactivate))?$/i,
      );
      if (staffRoute) {
        const member = state.staff.find((item) => item.id === staffRoute[1]);
        if (!member)
          return send(response, 404, { message: "Staff not found." });
        const branchId = url.searchParams.get("branch_id");
        if (branchId && !member.branch_ids.includes(branchId)) {
          return send(response, 404, {
            message: "Staff not found in this branch.",
          });
        }
        if (request.method === "PATCH" && !staffRoute[2]) {
          if (body.email !== undefined) member.email = body.email;
          if (body.full_name !== undefined) member.full_name = body.full_name;
          if (body.contact_number !== undefined) {
            member.contact_number = body.contact_number;
          }
          return send(response, 204);
        }
        if (request.method === "PUT" && staffRoute[2] === "role") {
          const role =
            body?.role_id === null
              ? null
              : state.roles.find((item) => item.id === String(body?.role_id));
          if (
            body?.role_id !== null &&
            (!role || role.code === "SUPER_ADMIN")
          ) {
            return send(response, 400, { message: "Invalid staff role." });
          }
          member.role_id = role?.id ?? null;
          member.role_code = role?.code ?? null;
          member.role_name = role?.role_name ?? null;
          return send(response, 204);
        }
        if (request.method === "PUT" && staffRoute[2] === "branches") {
          member.branch_ids = body.branch_ids;
          return send(response, 204);
        }
        if (request.method === "POST" && staffRoute[2] === "deactivate") {
          if (member.role_code === "SUPER_ADMIN") {
            return send(response, 403, {
              message: "Protected staff account.",
            });
          }
          member.is_active = false;
          return send(response, 204);
        }
      }
      const branchRoute = url.pathname.match(
        /^\/branches\/([0-9a-f-]{36})(?:\/(deactivate))?$/i,
      );
      if (branchRoute && request.method === "PATCH" && !branchRoute[2]) {
        const branch = state.branches.find(
          (item) => item.id === branchRoute[1],
        );
        if (!branch)
          return send(response, 404, { message: "Branch not found." });
        branch.branch_name = body.branch_name;
        branch.address = body.address ?? null;
        branch.date_opened = body.date_opened ?? null;
        branch.has_dine_in = body.has_dine_in;
        return send(response, 204);
      }
      if (branchRoute && branchRoute[2] && request.method === "POST") {
        const branch = state.branches.find(
          (item) => item.id === branchRoute[1],
        );
        if (!branch)
          return send(response, 404, { message: "Branch not found." });
        branch.status = "inactive";
        return send(response, 204);
      }
      if (url.pathname === "/roles" && request.method === "POST") {
        if (state.roles.some((role) => role.code === body?.code)) {
          return send(response, 409, { message: "Role code already exists." });
        }
        const nextId = String(
          Math.max(...state.roles.map((role) => Number(role.id))) + 1,
        );
        state.roles.push({
          id: nextId,
          code: body.code,
          role_name: body.role_name,
          is_system: false,
          is_predefined: false,
          is_active: true,
          permission_keys: body.permission_keys,
        });
        return send(response, 201, { id: nextId });
      }

      const deactivateRoute = url.pathname.match(
        /^\/roles\/(\d+)\/deactivate$/,
      );
      if (deactivateRoute && request.method === "POST") {
        const role = state.roles.find((item) => item.id === deactivateRoute[1]);
        if (!role) return send(response, 404, { message: "Role not found." });
        if (role.is_system) {
          return send(response, 403, {
            message: "System roles are protected.",
          });
        }
        role.is_active = false;
        return send(response, 204);
      }

      const roleRoute = url.pathname.match(
        /^\/roles\/(\d+)(?:\/(permissions))?$/,
      );
      if (roleRoute && request.method === "PATCH" && !roleRoute[2]) {
        const role = state.roles.find((item) => item.id === roleRoute[1]);
        if (!role) return send(response, 404, { message: "Role not found." });
        if (role.is_system) {
          return send(response, 403, {
            message: "System roles are protected.",
          });
        }
        role.role_name = body.role_name;
        return send(response, 204);
      }
      if (roleRoute && request.method === "PUT" && roleRoute[2]) {
        const role = state.roles.find((item) => item.id === roleRoute[1]);
        if (!role) return send(response, 404, { message: "Role not found." });
        if (role.is_system) {
          return send(response, 403, {
            message: "System roles are protected.",
          });
        }
        role.permission_keys = body.permission_keys;
        return send(response, 204);
      }
      return send(response, 404, {
        message: `No fixture for ${request.method} ${url.pathname}.`,
      });
    } catch (error) {
      if (!response.headersSent) {
        send(response, 500, { message: "Operational API fixture failed." });
      }
      if (process.env.COMS_FIXTURE_DEBUG === "1") {
        process.stderr.write(`${error.stack ?? error}\n`);
      }
    }
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.removeListener("error", reject);
      const address = server.address();
      resolve({
        server,
        port: address.port,
        baseUrl: `http://127.0.0.1:${address.port}`,
        close: () =>
          new Promise((done, fail) => {
            server.close((error) => (error ? fail(error) : done()));
          }),
      });
    });
  });
}

module.exports = { createOperationalApiFixture };
