const { handlePurchaseRequest } = require("./fixtures/purchases-fixture.cjs");
const { handleShiftRequest } = require("./fixtures/shifts-fixture.cjs");
const {
  seedReceivingFollowup,
} = require("./fixtures/receiving-followup-fixture.cjs");
const {
  createNotificationSeed,
  handleNotifications,
} = require("./fixtures/notifications-fixture.cjs");
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
  handleRestockSuggestions,
} = require("./fixtures/inventory-fixture.cjs");

const {
  categoryMetadata,
  productView,
  eligibleServices,
  handleCategoryRequest,
  handleProductRequest,
} = require("./fixtures/product-categories-fixture.cjs");

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

function receiptDetail(receipt) {
  const detail = { ...receipt };
  delete detail.payload_fingerprint;
  return detail;
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
      usage_types: ["INGREDIENT"],
      recipe_use: "RECIPE",
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
  const productCategories = clone(seed.product_categories);
  const products = seed.products.map((item, index) => ({
    id: "35000000-0000-4000-8000-" + String(index + 1).padStart(12, "0"),
    ...clone(item),
    description: index === 0 ? "Grilled chicken on sourdough" : null,
    price: String(100 + index) + ".0000",
    price_revision: 1,
    setup_revision: 1,
    service_types: index === 24 ? ["TAKEAWAY"] : ["DINE_IN", "TAKEAWAY"],
    is_active: index !== 2,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  }));
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
      idempotency_key: "40000000-0000-4000-8000-" + sequence,
      recorded_by_user_id: seed.user.id,
      recorded_by_name: "Fixture Operations Lead",
      recorded_at: "2026-09-25T01:30:00.000Z",
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
    productCategories,
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
    ...categoryMetadata(state, product),
    price_revision: product.price_revision,
    service_types: product.service_types,
    eligible_service_types: eligibleServices(branch, product),
    available_service_types: offer.is_available
      ? eligibleServices(branch, product)
      : [],
    has_dine_in: branch.has_dine_in,
    has_takeaway: branch.has_takeaway !== false,
    price: offer.price,
    is_available: offer.is_available,
    created_at: offer.created_at,
    updated_at: offer.updated_at,
  };
}

function dashboardTodayFixture() {
  const today = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);
  const day = (offset) =>
    new Date(Date.parse(today + "T00:00:00Z") - offset * 86_400_000)
      .toISOString()
      .slice(0, 10);
  const branchA = "10000000-0000-4000-8000-000000000001";
  const branchB = "10000000-0000-4000-8000-000000000002";
  return {
    workspace: "overview",
    access: { reports: true, shifts: true, sales: true, dispatches: true },
    submission_checklist_bypassed: false,
    report_progress: [branchA, branchB].flatMap((branch_id) =>
      [0, 1].map((offset) => ({
        branch_id,
        period: offset ? "yesterday" : "today",
        business_date: day(offset),
        report_id: null,
        status: "MISSING",
        total_items: null,
        counted_items: null,
        open_shifts: offset ? 0 : 1,
        unreviewed_shifts: 0,
        pending_deliveries: 0,
        counts_awaiting_review: 0,
        day_ended: Boolean(offset),
        had_sales: true,
      })),
    ),
    count_shortages: {
      days: 7,
      branches: [
        {
          branch_id: branchB,
          branch_name: "Cebu Branch",
          reports: 6,
          short_lines: 3,
          uncosted_short_lines: 0,
          shortage_value: "1180.00",
        },
        {
          branch_id: branchA,
          branch_name: "Manila - Ermita",
          reports: 7,
          short_lines: 1,
          uncosted_short_lines: 0,
          shortage_value: "96.00",
        },
      ],
      items: [
        {
          branch_id: branchB,
          branch_name: "Cebu Branch",
          stock_item_id: "30000000-0000-4000-8000-000000000001",
          stock_item_name: "Chicken leg quarter",
          unit: "kg",
          short_quantity: "4.5",
          shortage_value: "1080.00",
          times_short: 3,
          latest_report_id: "40000000-0000-4000-8000-000000000001",
          latest_business_date: day(1),
        },
        {
          branch_id: branchA,
          branch_name: "Manila - Ermita",
          stock_item_id: "30000000-0000-4000-8000-000000000002",
          stock_item_name: "Cooking oil",
          unit: "L",
          short_quantity: "0.8",
          shortage_value: "96.00",
          times_short: 1,
          latest_report_id: "40000000-0000-4000-8000-000000000002",
          latest_business_date: day(2),
        },
      ],
    },
    report_backlog: {
      total: 1,
      items: [
        {
          branch_id: branchB,
          branch_name: "Cebu Branch",
          business_date: day(4),
          report_id: null,
          status: "MISSING",
          days_outstanding: 4,
        },
      ],
    },
    business_date: today,
    as_of: new Date().toISOString(),
    scope_label: "All branches",
    branch_options: [
      { id: branchB, name: "Cebu Branch", status: "active" },
      { id: branchA, name: "Manila - Ermita", status: "active" },
    ],
    show_costs: true,
    today: {
      net_sales: "6840.00",
      sales_count: 38,
      average_sale: "180.00",
      items_sold: "86",
      void_count: 1,
      food_cost: "2667.60",
      gross_profit: "4172.40",
      cost_coverage_percent: "96.4",
    },
    last_week_same_time: { net_sales: "6480.00", sales_count: 36 },
    yesterday_same_time: { net_sales: "6120.00", sales_count: 35 },
    changes: {
      net_sales: "5.6",
      sales_count: "5.6",
      net_sales_vs_yesterday: "11.8",
    },
    attention: [
      { key: "deliveries_overdue", count: 1 },
      { key: "open_discrepancies", count: 1 },
      { key: "shifts_open_past_day", count: 0 },
      { key: "cash_shortages", count: 1 },
      { key: "stock_below_zero", count: 3 },
      { key: "branch_stock_low", count: 4 },
      { key: "commissary_stock_low", count: 1 },
      { key: "reports_missing", count: 1 },
      { key: "reports_returned", count: 0 },
      { key: "reports_to_review", count: 2 },
      { key: "late_counts_to_review", count: 0 },
      { key: "shifts_to_review", count: 1 },
      { key: "dispatches_draft", count: 2 },
      { key: "deliveries_in_transit", count: 2 },
      { key: "products_incomplete_costs", count: 1 },
    ],
    branches: [
      {
        branch_id: branchA,
        branch_name: "Manila - Ermita",
        status: "active",
        shift_id: null,
        shift_number: 2,
        cashier_name: "Ana Cruz",
        opened_at: new Date(Date.now() - 5 * 3600_000).toISOString(),
        sales_count: 24,
        net_sales: "4320.00",
        last_sale_at: new Date(Date.now() - 6 * 60_000).toISOString(),
        yesterday_report_status: "SUBMITTED",
      },
      {
        branch_id: branchB,
        branch_name: "Cebu Branch",
        status: "active",
        shift_id: null,
        shift_number: 1,
        cashier_name: "Ben Reyes",
        opened_at: new Date(Date.now() - 4 * 3600_000).toISOString(),
        sales_count: 14,
        net_sales: "2520.00",
        last_sale_at: new Date(Date.now() - 21 * 60_000).toISOString(),
        yesterday_report_status: "MISSING",
      },
    ],
    last_7_days: [6, 5, 4, 3, 2, 1, 0].map((offset, index) => ({
      date: day(offset),
      sales_count: 30 + index,
      net_sales: String(8200 + ((index * 1370) % 2600)) + ".00",
      food_cost: "3100.00",
      gross_profit: "5100.00",
    })),
    top_products_today: [
      {
        product_id: "20000000-0000-4000-8000-000000000001",
        name: "Tapsilog",
        quantity: "11",
        net_sales: "1859.00",
      },
      {
        product_id: "20000000-0000-4000-8000-000000000002",
        name: "Chicken Inasal Rice Meal",
        quantity: "8",
        net_sales: "1432.00",
      },
      {
        product_id: "20000000-0000-4000-8000-000000000003",
        name: "Bangsilog",
        quantity: "6",
        net_sales: "1074.00",
      },
    ],
    // A lunch and dinner rush across the day, with last week slightly lower.
    hourly: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((hour) => {
      const rush = [11, 12, 18].includes(hour)
        ? 3
        : [13, 19].includes(hour)
          ? 2
          : 1;
      return {
        hour: String(hour).padStart(2, "0") + ":00",
        sales_count: rush * 2,
        net_sales: (rush * 360).toFixed(2),
        last_week_net_sales: (rush * 330 + (hour % 3) * 40).toFixed(2),
      };
    }),
  };
}

function salesReportFixture(query) {
  const period = ["day", "week", "month"].includes(query.get("period"))
    ? query.get("period")
    : "week";
  const totals = {
    gross_sales: "12450.00",
    net_sales: "11980.00",
    sales_count: 64,
    average_sale: "187.19",
    items_sold: "142",
    void_count: 2,
    void_amount: "470.00",
    food_cost: "4672.20",
    gross_profit: "7307.80",
    food_cost_percent: "39",
    cost_coverage_percent: "96.5",
  };
  const days = ["2026-10-19", "2026-10-20", "2026-10-21"];
  return {
    period,
    period_range: { from: "2026-10-19", to: "2026-10-25" },
    range: { from: "2026-10-19", to: "2026-10-21" },
    previous_range: { from: "2026-10-12", to: "2026-10-14" },
    in_progress: true,
    branch: null,
    scope_label: "All branches",
    branch_options: [
      {
        id: "10000000-0000-4000-8000-000000000001",
        name: "Manila - Ermita",
        status: "active",
      },
      {
        id: "10000000-0000-4000-8000-000000000002",
        name: "Cebu Branch",
        status: "active",
      },
    ],
    show_costs: true,
    headline: totals,
    previous: { ...totals, net_sales: "10650.00" },
    changes: {
      gross_sales: "11.2",
      net_sales: "12.5",
      sales_count: "6.7",
      average_sale: "5.4",
      void_amount: "-21.7",
      gross_profit: "9.8",
      food_cost_percent_points: "1.4",
    },
    cash: {
      closed_shifts: 6,
      short_shifts: 1,
      over_shifts: 1,
      cash_difference: "-35.00",
      short_amount: "-60.00",
      over_amount: "25.00",
    },
    stock: {
      approved_reports: 4,
      waste_value: "312.50",
      variance_value: "-128.40",
    },
    by_branch: [
      {
        branch_id: "10000000-0000-4000-8000-000000000001",
        branch_name: "Manila - Ermita",
        sales_count: 40,
        net_sales: "7520.00",
        average_sale: "188.00",
        cash_difference: "-35.00",
        food_cost: "2930.10",
        gross_profit: "4589.90",
      },
      {
        branch_id: "10000000-0000-4000-8000-000000000002",
        branch_name: "Cebu Branch",
        sales_count: 24,
        net_sales: "4460.00",
        average_sale: "185.83",
        cash_difference: "0.00",
        food_cost: "1742.10",
        gross_profit: "2717.90",
      },
    ],
    by_payment: [
      {
        name: "Cash",
        sales_count: 44,
        amount: "8120.00",
        share_percent: "67.8",
      },
      {
        name: "GCash",
        sales_count: 20,
        amount: "3860.00",
        share_percent: "32.2",
      },
    ],
    by_service: [
      {
        service_type: "DINE_IN",
        sales_count: 41,
        amount: "7710.00",
        share_percent: "64.4",
      },
      {
        service_type: "TAKEAWAY",
        sales_count: 23,
        amount: "4270.00",
        share_percent: "35.6",
      },
    ],
    by_category: [
      {
        name: "Silog meals",
        quantity: "48",
        net_sales: "7480.00",
        share_percent: "62.4",
        food_cost: "3010.00",
        gross_profit: "4470.00",
      },
      {
        name: "Beverages",
        quantity: "51",
        net_sales: "2240.00",
        share_percent: "18.7",
        food_cost: "520.00",
        gross_profit: "1720.00",
      },
    ],
    top_products: [
      {
        product_id: "20000000-0000-4000-8000-000000000001",
        name: "Tapsilog",
        quantity: "22",
        net_sales: "3718.00",
        food_cost: "1663.20",
        gross_profit: "2054.80",
      },
      {
        product_id: "20000000-0000-4000-8000-000000000002",
        name: "Bangsilog",
        quantity: "12",
        net_sales: "2148.00",
        food_cost: "1382.40",
        gross_profit: "765.60",
      },
    ],
    daily:
      period === "day"
        ? []
        : days.map((date, index) => ({
            date,
            sales_count: 20 + index,
            net_sales: String(3600 + index * 380) + ".00",
            food_cost: "1400.00",
            gross_profit: String(2200 + index * 380) + ".00",
          })),
  };
}

const auditEvent = (index, patch) => ({
  id: `00000000-0000-4000-8000-${String(900000000000 + index)}`,
  occurred_at: new Date(
    Date.UTC(2026, 9, 21, 13, 30 - index * 7),
  ).toISOString(),
  actor_user_id: "00000000-0000-4000-8000-000000000101",
  actor_name: "Maria Santos",
  entity_id: null,
  branch_id: null,
  changes: {},
  metadata: {},
  ...patch,
});
const auditEventSeed = [
  auditEvent(1, {
    action: "product.updated",
    entity_type: "product",
    entity_label: "Tapsilog",
    changes: {
      price: { from: "150.00", to: "169.00" },
      category_id: { from: "Rice meals", to: "Silog meals" },
    },
  }),
  auditEvent(2, {
    action: "stock_item.cost_set",
    entity_type: "stock_item",
    entity_label: "Boneless Bangus",
    changes: { average_unit_cost: { from: "88.0000", to: "95.0000" } },
    metadata: { reason: "New supplier price list" },
  }),
  auditEvent(3, {
    action: "role.permissions_updated",
    entity_type: "role",
    entity_label: "Branch Manager",
    metadata: { granted: ["costs.read", "audit.read"], revoked: [] },
  }),
  auditEvent(4, {
    action: "product.recipe_updated",
    entity_type: "product",
    entity_label: "Bangsilog",
    metadata: { added: ["Garlic 0.01 kg"], removed: ["Garlic 0.02 kg"] },
  }),
  auditEvent(5, {
    action: "auth.sign_in_failed",
    entity_type: "staff",
    entity_label: "Juan Dela Cruz",
    actor_user_id: null,
    actor_name: null,
    metadata: { email: "juan@example.com" },
  }),
  auditEvent(6, {
    action: "supplier.updated",
    entity_type: "supplier",
    entity_label: "Fresh Catch Trading",
    changes: { is_active: { from: true, to: false } },
  }),
  auditEvent(7, {
    action: "staff.password_reset",
    entity_type: "staff",
    entity_label: "Juan Dela Cruz",
  }),
];

function createOperationalApiFixture({
  gatewaySecret,
  authUser = seed.user,
  stockItemCount = 26,
  notificationCount = 0,
  receivingFollowup = false,
  openShifts = true,
  sampleReport = false,
}) {
  if (!gatewaySecret || !/^[a-f0-9]{64}$/i.test(gatewaySecret)) {
    throw new Error(
      "The operational fixture requires a generated gateway secret.",
    );
  }

  let state = createState({ stockItemCount });
  if (receivingFollowup) seedReceivingFollowup(state);
  let notificationItems = createNotificationSeed(state, notificationCount);
  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");

    try {
      const body = await readJson(request);

      if (url.pathname === "/__fixture/reset" && request.method === "POST") {
        state = createState({ stockItemCount });
        if (receivingFollowup) seedReceivingFollowup(state);
        notificationItems = createNotificationSeed(state, notificationCount);
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
          notifications: notificationItems,
          roles: state.roles,
          branches: state.branches,
          staff: state.staff,
          suppliers: state.suppliers,
          stockItems: state.stockItems,
          productCategories: state.productCategories,
          product_categories: state.productCategories,
          products: state.products.map((product) =>
            productView(state, product),
          ),
          branchProducts: state.branchProducts.map((offer) =>
            branchProductView(state, offer),
          ),
          recipes: state.recipes,
          purchases: state.purchases ?? [],
          receipts: state.receipts.map(receiptDetail),
          commissaryBalances: state.commissaryBalances,
          commissaryMovements: state.commissaryMovements,
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
      if (
        handleNotifications({
          request,
          response,
          url,
          items: notificationItems,
          send,
        })
      )
        return;

      if (
        url.pathname === "/payment-methods/available" &&
        request.method === "GET"
      ) {
        return send(
          response,
          200,
          seed.payment_methods
            .filter((method) => method.is_active)
            .map(({ id, name, kind }) => ({ id, name, kind })),
        );
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

      const restockResponse = handleRestockSuggestions({
        request,
        response,
        url,
        state,
      });
      if (restockResponse !== false) return restockResponse;
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

      const shiftResponse = handleShiftRequest({
        request,
        response,
        url,
        body,
        state,
        authUser,
        openShifts,
        sampleReport,
      });
      if (shiftResponse !== false) return shiftResponse;

      const purchaseResponse = handlePurchaseRequest({
        request,
        response,
        url,
        body,
        state,
        seed,
      });
      if (purchaseResponse !== false) return purchaseResponse;
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

      const categoryResponse = handleCategoryRequest({
        request,
        response,
        url,
        body,
        state,
        authUser,
        send,
      });
      if (categoryResponse !== false) return categoryResponse;
      const productResponse = handleProductRequest({
        request,
        response,
        url,
        body,
        state,
        send,
        pageItems,
      });
      if (productResponse !== false) return productResponse;

      const branchCategoriesRoute = url.pathname.match(
        /^\/branches\/([0-9a-f-]{36})\/products\/categories$/i,
      );
      if (branchCategoriesRoute && request.method === "GET") {
        const branch = state.branches.find(
          (item) => item.id === branchCategoriesRoute[1],
        );
        if (!branch)
          return send(response, 404, { message: "Branch not found." });
        const service = url.searchParams.get("service_type");
        if (service && !["DINE_IN", "TAKEAWAY"].includes(service))
          return send(response, 400, { message: "Invalid service type." });
        const ids = new Set(
          state.branchProducts
            .filter(
              (offer) => offer.branch_id === branch.id && offer.is_available,
            )
            .flatMap((offer) => {
              const product = state.products.find(
                (item) => item.id === offer.product_id,
              );
              if (
                !product ||
                !categoryMetadata(state, product).category_is_active
              )
                return [];
              const services = eligibleServices(branch, product);
              return services.length && (!service || services.includes(service))
                ? [product.category_id]
                : [];
            }),
        );
        return send(
          response,
          200,
          state.productCategories
            .filter((category) => ids.has(category.id))
            .map(({ id, name }) => ({ id, name }))
            .sort(
              (a, b) =>
                a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
            ),
        );
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
          const categoryId = url.searchParams.get("category_id");
          const service = url.searchParams.get("service_type");
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
              if (categoryId && product.category_id !== categoryId)
                return false;
              if (
                service &&
                !eligibleServices(branch, product).includes(service)
              )
                return false;
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
          return send(response, 201, branchProductView(state, offer));
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
        const from = url.searchParams.get("received_from");
        const to = url.searchParams.get("received_to");
        const min = url.searchParams.get("min_cost");
        const max = url.searchParams.get("max_cost");
        const sort = url.searchParams.get("sort") ?? "newest";
        const compareCost = (a, b) => {
          const x = decimalParts(a),
            y = decimalParts(b);
          const scale = Math.max(x.scale, y.scale);
          const left = x.digits * 10n ** BigInt(scale - x.scale),
            right = y.digits * 10n ** BigInt(scale - y.scale);
          return left < right ? -1 : left > right ? 1 : 0;
        };
        const matches = state.receipts
          .filter(
            (receipt) =>
              (!search ||
                receipt.supplier_name.toLowerCase().includes(search)) &&
              (!from || receipt.received_at >= from) &&
              (!to || receipt.received_at <= to) &&
              (!min || compareCost(receipt.total_cost, min) >= 0) &&
              (!max || compareCost(receipt.total_cost, max) <= 0),
          )
          .sort((left, right) => {
            const primary = sort.startsWith("cost_")
              ? compareCost(left.total_cost, right.total_cost) *
                (sort === "cost_highest" ? -1 : 1)
              : sort.startsWith("supplier_")
                ? left.supplier_name.localeCompare(right.supplier_name) *
                  (sort === "supplier_desc" ? -1 : 1)
                : 0;
            return (
              primary ||
              (left.received_at.localeCompare(right.received_at) ||
                left.created_at.localeCompare(right.created_at) ||
                left.id.localeCompare(right.id)) * (sort === "oldest" ? 1 : -1)
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
            const listItem = receiptDetail(receipt);
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
          typeof body.received_at !== "string" ||
          !Array.isArray(body.items) ||
          body.items.length === 0 ||
          body.items.length > 100
        ) {
          return send(response, 400, { message: "Invalid fixture receipt." });
        }
        const idempotencyKey = request.headers["idempotency-key"];
        if (typeof idempotencyKey !== "string" || !idempotencyKey) {
          return send(response, 400, { message: "Missing idempotency key." });
        }
        const supplier = state.suppliers.find(
          (item) => item.id === body.supplier_id,
        );
        if (!supplier || !supplier.is_active) {
          return send(response, 404, { message: "Supplier not found." });
        }
        const seenStockItemIds = new Set();
        const normalizedLines = body.items.map((line) => {
          if (
            typeof line?.stock_item_id !== "string" ||
            typeof line?.quantity_received !== "string" ||
            !/^\d+(?:\.\d+)?$/.test(line.quantity_received) ||
            !/[1-9]/.test(line.quantity_received) ||
            typeof line?.unit_cost !== "string" ||
            !/^\d+(?:\.\d+)?$/.test(line.unit_cost) ||
            seenStockItemIds.has(line.stock_item_id)
          )
            return null;
          seenStockItemIds.add(line.stock_item_id);
          const stockItem = state.stockItems.find(
            (item) => item.id === line.stock_item_id && item.is_active,
          );
          if (!stockItem) return null;
          return {
            stock_item: stockItem,
            quantity_received: line.quantity_received,
            unit_cost: line.unit_cost,
          };
        });
        if (normalizedLines.some((line) => line === null)) {
          return send(response, 400, {
            message:
              "Choose unique active stock items and valid quantities/costs.",
          });
        }
        const fingerprint = JSON.stringify({
          supplier_id: supplier.id,
          received_at: body.received_at,
          items: normalizedLines
            .map((line) => ({
              stock_item_id: line.stock_item.id,
              quantity_received: line.quantity_received,
              unit_cost: line.unit_cost,
            }))
            .sort((left, right) =>
              left.stock_item_id.localeCompare(right.stock_item_id),
            ),
        });
        const retry = state.receipts.find(
          (receipt) => receipt.idempotency_key === idempotencyKey,
        );
        if (retry) {
          if (retry.payload_fingerprint !== fingerprint) {
            return send(response, 409, {
              message: "Idempotency key was already used with different data.",
            });
          }
          return send(response, 201, receiptDetail(retry));
        }
        const items = normalizedLines.map(
          ({ stock_item: stockItem, quantity_received, unit_cost }, index) => ({
            id:
              "51000000-0000-4000-8000-" +
              String(state.receipts.length * 100 + index + 1).padStart(12, "0"),
            stock_item_id: stockItem.id,
            stock_item_name: stockItem.stock_item_name,
            unit: stockItem.unit,
            quantity_received,
            unit_cost,
            line_total: decimalMultiply(quantity_received, unit_cost),
          }),
        );
        const sequence = String(state.receipts.length + 1).padStart(12, "0");
        const now = "2026-09-25T02:00:00.000Z";
        const receipt = {
          id: "32000000-0000-4000-8000-" + sequence,
          supplier_id: supplier.id,
          supplier_name: supplier.supplier_name,
          received_at: body.received_at,
          idempotency_key: idempotencyKey,
          recorded_by_user_id: seed.user.id,
          recorded_by_name: "Fixture Operations Lead",
          recorded_at: now,
          created_at: now,
          updated_at: now,
          total_cost: decimalSum(items.map((item) => item.line_total)),
          item_count: items.length,
          items,
          payload_fingerprint: fingerprint,
        };
        state.receipts.push(receipt);
        for (const item of items) {
          const balance = state.commissaryBalances.find(
            (candidate) => candidate.id === item.stock_item_id,
          );
          if (balance) {
            balance.quantity_on_hand = decimalSum([
              balance.quantity_on_hand,
              item.quantity_received,
            ]);
          }
          state.commissaryMovements.push({
            id:
              "73000000-0000-4000-8000-" +
              String(state.commissaryMovements.length + 1).padStart(12, "0"),
            inventory_scope: "COMMISSARY",
            branch_id: null,
            stock_item_id: item.stock_item_id,
            stock_item_name: item.stock_item_name,
            unit: item.unit,
            movement_type: "RECEIPT",
            quantity_delta: item.quantity_received,
            reason: `Supplier delivery ${receipt.id}`,
            actor_user_id: seed.user.id,
            idempotency_key: idempotencyKey,
            created_at: now,
          });
        }
        return send(response, 201, receiptDetail(receipt));
      }
      const receiptRoute = url.pathname.match(
        /^\/supplier-receipts\/([0-9a-f-]{36})$/i,
      );
      if (receiptRoute && request.method === "GET") {
        const receipt = state.receipts.find(
          (item) => item.id === receiptRoute[1],
        );
        if (!receipt) {
          return send(response, 404, {
            message: "Supplier receipt not found.",
          });
        }
        return send(response, 200, receiptDetail(receipt));
      }

      if (
        url.pathname === "/stock-requests" ||
        url.pathname.startsWith("/stock-requests/")
      ) {
        return send(response, 404, { message: "Not found." });
      }

      if (url.pathname === "/roles" && request.method === "GET") {
        return send(response, 200, state.roles);
      }
      if (url.pathname === "/roles/permissions" && request.method === "GET") {
        return send(response, 200, seed.permissions);
      }
      if (url.pathname === "/reports/sales" && request.method === "GET") {
        return send(response, 200, salesReportFixture(url.searchParams));
      }
      if (url.pathname === "/dashboard/today" && request.method === "GET") {
        return send(response, 200, dashboardTodayFixture());
      }
      if (url.pathname === "/reports/sales/pdf" && request.method === "GET") {
        response.writeHead(200, {
          "cache-control": "no-store",
          "content-type": "application/pdf",
          "content-disposition":
            'attachment; filename="coms-sales-report-all-branches.pdf"',
        });
        response.end("%PDF-1.4\n%fixture\n");
        return;
      }
      // Any CSV export echoes its forwarded filters; fail-next can force errors.
      if (url.pathname.endsWith("/export") && request.method === "GET") {
        const name = url.pathname.split("/").filter(Boolean).join("-");
        response.writeHead(200, {
          "cache-control": "no-store",
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="coms-${name}.csv"`,
        });
        response.end(`\uFEFFFilters\r\n${url.searchParams.toString()}\r\n`);
        return;
      }
      if (url.pathname === "/audit-events" && request.method === "GET") {
        const area = url.searchParams.get("entity_type");
        const search = (url.searchParams.get("search") ?? "").toLowerCase();
        const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
        const pageSize = Number(url.searchParams.get("page_size")) || 10;
        const items = auditEventSeed.filter(
          (event) =>
            (!area || event.entity_type === area) &&
            (!search ||
              [event.actor_name, event.entity_label, event.action].some(
                (value) => value?.toLowerCase().includes(search),
              )),
        );
        return send(response, 200, {
          items: items.slice((page - 1) * pageSize, page * pageSize),
          total: items.length,
          page,
          page_size: pageSize,
        });
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
