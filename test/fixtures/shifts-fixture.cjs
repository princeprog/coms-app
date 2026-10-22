// Simulated register shifts for UI tests. Real cash math, locking and permissions are covered by coms-api integration tests.
const { randomUUID } = require("node:crypto");

function send(response, status, body) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

const manilaDate = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(
    new Date(),
  );
const cents = (value) => Math.round(Number(value) * 100);
const text = (value) => (value / 100).toFixed(2).replace(/\.?0+$/, "") || "0";

function blankShift(state, branchId, user, openingFloat) {
  const previous = state.shifts
    .filter((shift) => shift.branch_id === branchId && shift.status !== "OPEN")
    .at(-1);
  const today = manilaDate();
  const number =
    state.shifts.filter(
      (s) => s.branch_id === branchId && s.business_date === today,
    ).length + 1;
  const expected = previous ? previous.left_in_drawer : null;
  return {
    id: randomUUID(),
    branch_id: branchId,
    branch_name:
      state.branches.find((branch) => branch.id === branchId)?.branch_name ??
      "Branch",
    business_date: today,
    shift_number: number,
    status: "OPEN",
    opened_by_user_id: user.id,
    opened_by_name: user.full_name,
    opened_at: new Date().toISOString(),
    opening_float: openingFloat,
    expected_opening_float: expected,
    opening_difference:
      expected === null ? null : text(cents(openingFloat) - cents(expected)),
    closed_by_user_id: null,
    closed_by_name: null,
    closed_at: null,
    close_type: null,
    force_close_reason: null,
    counted_cash: null,
    left_in_drawer: null,
    expected_cash: null,
    cash_difference: null,
    cashier_explanation: null,
    reviewed_by_user_id: null,
    reviewed_by_name: null,
    reviewed_at: null,
    review_note: null,
    business_day_ends_at: new Date(Date.now() + 8 * 3600_000).toISOString(),
    business_day_ended: false,
    sales_count: 0,
    cash_movements: [],
  };
}

function expectedCash(shift) {
  return shift.cash_movements.reduce(
    (sum, move) =>
      sum + (move.direction === "IN" ? 1 : -1) * cents(move.amount),
    cents(shift.opening_float),
  );
}

function detail(shift, hideCash) {
  const { report: fixed, ...row } = shift;
  if (fixed)
    return {
      ...row,
      totals: fixed.totals,
      payments: fixed.payments,
      voids: fixed.voids,
      cash_hidden: false,
    };
  const moves = shift.cash_movements;
  const sum = (direction) =>
    text(
      moves
        .filter((m) => m.direction === direction)
        .reduce((s, m) => s + cents(m.amount), 0),
    );
  const hidden = hideCash && shift.status === "OPEN";
  return {
    ...row,
    totals: {
      cash_sales_amount: hidden ? null : "0",
      non_cash_sales_amount: hidden ? null : "0",
      cash_refunds_amount: hidden ? null : "0",
      cash_in_amount: sum("IN"),
      cash_out_amount: sum("OUT"),
      expected_cash: hidden
        ? null
        : (shift.expected_cash ?? text(expectedCash(shift))),
      sales_count: shift.sales_count,
      voids_count: 0,
    },
    payments: [],
    voids: [],
    cash_hidden: hidden,
  };
}

/** The shift page's report figures; blind counts hide them like the API. */
function report(shift, hideCash) {
  const base = detail(shift, hideCash);
  if (base.cash_hidden) return { ...base, sales_summary: null, products: [] };
  return {
    ...base,
    sales_summary: shift.report?.sales_summary ?? {
      sales_count: shift.sales_count,
      gross_amount: "0",
      voided_count: 0,
      voided_amount: "0",
      completed_count: shift.sales_count,
      net_amount: "0",
      average_amount: null,
      items_sold: "0",
      dine_in_count: 0,
      dine_in_amount: "0",
      takeaway_count: 0,
      takeaway_amount: "0",
      first_sale_at: null,
      last_sale_at: null,
    },
    products: shift.report?.products ?? [],
  };
}

const at = (date, time) => new Date(`${date}T${time}:00+08:00`).toISOString();

/**
 * A closed lunch shift by another cashier, awaiting review. Figures reconcile:
 * 2000 float + 4880 cash sales − 268 refund + 500 in − 350 out = 6762 expected.
 */
function sampleReportShift(state) {
  const branch = state.branches[0];
  const date = manilaDate();
  const products = [
    ["Chicken Joy 1-pc with Rice", "Chicken meals", 18, 1782],
    ["2-pc Fried Chicken with Rice", "Chicken meals", 9, 1521],
    ["6-pc Chicken Bucket", "Buckets", 3, 1497],
    ["Chicken Sisig Rice", "Rice meals", 6, 774],
    ["Iced Tea (Large)", "Drinks", 12, 540],
    ["Spaghetti", "Sides", 7, 483],
    ["Halo-Halo", "Desserts", 4, 316],
    ["Extra Rice", "Sides", 15, 300],
    ["Coke Mismo", "Drinks", 10, 250],
    ["Gravy Cup", "Sides", 8, 120],
  ].map(([product_name, category_name, quantity, amount], index) => ({
    product_id: `50000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    product_name,
    category_name,
    quantity: String(quantity),
    amount: String(amount),
  }));
  return {
    id: "51000000-0000-4000-8000-000000000001",
    branch_id: branch.id,
    branch_name: branch.branch_name,
    business_date: date,
    shift_number: 1,
    status: "CLOSED",
    opened_by_user_id: "52000000-0000-4000-8000-000000000001",
    opened_by_name: "Maria Santos",
    opened_at: at(date, "06:02"),
    opening_float: "2000",
    expected_opening_float: "2000",
    opening_difference: "0",
    closed_by_user_id: "52000000-0000-4000-8000-000000000001",
    closed_by_name: "Maria Santos",
    closed_at: at(date, "14:08"),
    close_type: "CASHIER",
    force_close_reason: null,
    counted_cash: "6750",
    left_in_drawer: "2000",
    expected_cash: "6762",
    cash_difference: "-12",
    cashier_explanation: "Gave ₱12 extra change during the lunch rush.",
    reviewed_by_user_id: null,
    reviewed_by_name: null,
    reviewed_at: null,
    review_note: null,
    business_day_ends_at: new Date(Date.now() + 8 * 3600_000).toISOString(),
    business_day_ended: false,
    sales_count: 32,
    cash_movements: [
      {
        id: "53000000-0000-4000-8000-000000000001",
        direction: "IN",
        amount: "500",
        reason: "Change fund from main office",
        actor_name: "Maria Santos",
        created_at: at(date, "07:15"),
      },
      {
        id: "53000000-0000-4000-8000-000000000002",
        direction: "OUT",
        amount: "350",
        reason: "Paid LPG refill",
        actor_name: "Maria Santos",
        created_at: at(date, "11:40"),
      },
    ],
    report: {
      totals: {
        cash_sales_amount: "4880",
        non_cash_sales_amount: "2971",
        cash_refunds_amount: "268",
        cash_in_amount: "500",
        cash_out_amount: "350",
        expected_cash: "6762",
        sales_count: 32,
        voids_count: 1,
      },
      payments: [
        {
          tender_method: "Cash",
          payment_kind: "CASH",
          sales_count: 20,
          amount: "4612",
        },
        {
          tender_method: "GCash",
          payment_kind: "NON_CASH",
          sales_count: 8,
          amount: "2156",
        },
        {
          tender_method: "Maya",
          payment_kind: "NON_CASH",
          sales_count: 3,
          amount: "815",
        },
      ],
      voids: [
        {
          sale_id: "54000000-0000-4000-8000-000000000001",
          sale_reference: "S-001284",
          amount: "268",
          payment_kind: "CASH",
          reason: "Customer cancelled the order",
          actor_name: "Maria Santos",
          created_at: at(date, "12:05"),
        },
      ],
      sales_summary: {
        sales_count: 32,
        gross_amount: "7851",
        voided_count: 1,
        voided_amount: "268",
        completed_count: 31,
        net_amount: "7583",
        average_amount: "244.61",
        items_sold: "92",
        dine_in_count: 19,
        dine_in_amount: "4390",
        takeaway_count: 12,
        takeaway_amount: "3193",
        first_sale_at: at(date, "06:24"),
        last_sale_at: at(date, "13:51"),
      },
      products,
    },
  };
}

function seedShifts(state, user, openShifts, sampleReport) {
  if (state.shifts) return;
  state.shifts = [];
  if (sampleReport) state.shifts.push(sampleReportShift(state));
  if (!openShifts) return;
  for (const branch of state.branches)
    state.shifts.push(blankShift(state, branch.id, user, "1000"));
}

function businessDay(state) {
  const today = manilaDate();
  return {
    business_today: today,
    today_start: new Date(`${today}T00:00:00+08:00`).toISOString(),
    today_end: new Date(
      new Date(`${today}T00:00:00+08:00`).getTime() + 86_400_000,
    ).toISOString(),
    current: { start_time: "00:00", effective_from: "2000-01-01" },
    scheduled: state.businessDayScheduled ?? null,
  };
}

function handleShiftRequest({
  request,
  response,
  url,
  body,
  state,
  authUser,
  openShifts = true,
  sampleReport = false,
}) {
  if (url.pathname === "/settings/business-day") {
    if (request.method === "PUT") state.businessDayScheduled = body;
    return send(response, 200, businessDay(state));
  }
  if (
    url.pathname === "/settings/business-day/scheduled" &&
    request.method === "DELETE"
  ) {
    state.businessDayScheduled = null;
    return send(response, 200, businessDay(state));
  }
  if (url.pathname === "/shifts/mine" && request.method === "GET") {
    seedShifts(state, authUser, openShifts, sampleReport);
    const own = state.shifts.find(
      (shift) =>
        shift.status === "OPEN" && shift.opened_by_user_id === authUser.id,
    );
    const reviewer =
      authUser.role?.code === "SUPER_ADMIN" ||
      (authUser.permissions ?? []).includes("shifts.review");
    return send(response, 200, { shift: own ? detail(own, !reviewer) : null });
  }
  const route = url.pathname.match(
    /^\/branches\/([0-9a-f-]{36})\/shifts(?:\/(current|[0-9a-f-]{36}))?(?:\/(cash-movements|close|force-close|explanation|review))?$/i,
  );
  if (!route) return false;
  seedShifts(state, authUser, openShifts, sampleReport);
  const [, branchId, target, action] = route;
  const permissions = authUser.permissions ?? [];
  const review =
    authUser.role?.code === "SUPER_ADMIN" ||
    permissions.includes("shifts.review");
  const branchShifts = state.shifts.filter(
    (shift) => shift.branch_id === branchId,
  );
  if (target === "current")
    return send(response, 200, {
      shift: (() => {
        const open = branchShifts.find((shift) => shift.status === "OPEN");
        return open ? detail(open, !review) : null;
      })(),
    });
  if (!target && request.method === "GET") {
    const page = Number(url.searchParams.get("page") || 1);
    const size = Number(url.searchParams.get("page_size") || 10);
    const status = url.searchParams.get("status");
    const rows = branchShifts
      .filter((shift) => !status || shift.status === status)
      .slice()
      .reverse();
    return send(response, 200, {
      items: rows
        .slice((page - 1) * size, page * size)
        .map(({ cash_movements: _m, report: _r, ...shift }) => shift),
      total: rows.length,
      page,
      page_size: size,
    });
  }
  if (!target && request.method === "POST") {
    if (branchShifts.some((shift) => shift.status === "OPEN"))
      return send(response, 409, {
        code: "SHIFT_ALREADY_OPEN",
        message: "A shift is still open. It must be closed first.",
      });
    const shift = blankShift(state, branchId, authUser, body.opening_float);
    state.shifts.push(shift);
    return send(response, 201, detail(shift, !review));
  }
  const shift = branchShifts.find((item) => item.id === target);
  if (!shift) return send(response, 404, { message: "Shift not found" });
  if (!action) return send(response, 200, report(shift, !review));
  if (action === "cash-movements") {
    shift.cash_movements.push({
      id: randomUUID(),
      ...body,
      actor_name: authUser.full_name,
      created_at: new Date().toISOString(),
    });
    return send(response, 201, detail(shift, !review));
  }
  if (action === "close" || action === "force-close") {
    if (shift.status !== "OPEN")
      return send(response, 409, { message: "This shift is already closed" });
    const expected = expectedCash(shift);
    Object.assign(shift, {
      status: "CLOSED",
      closed_by_user_id: authUser.id,
      closed_by_name: authUser.full_name,
      closed_at: new Date().toISOString(),
      close_type: action === "close" ? "CASHIER" : "FORCED",
      force_close_reason: body.reason ?? null,
      counted_cash: body.counted_cash,
      left_in_drawer: body.left_in_drawer,
      expected_cash: text(expected),
      cash_difference: text(cents(body.counted_cash) - expected),
    });
    return send(response, 201, detail(shift, false));
  }
  if (action === "explanation") {
    shift.cashier_explanation = body.explanation;
    return send(response, 201, detail(shift, false));
  }
  if (
    shift.opened_by_user_id === authUser.id &&
    authUser.role?.code !== "SUPER_ADMIN"
  )
    return send(response, 403, {
      message: "Another manager must review a shift you worked",
    });
  const differs = [shift.cash_difference, shift.opening_difference].some(
    (v) => v && Number(v) !== 0,
  );
  if (differs && !body.note)
    return send(response, 400, {
      message: "Add a review note explaining the cash difference",
    });
  Object.assign(shift, {
    status: "REVIEWED",
    reviewed_by_user_id: authUser.id,
    reviewed_by_name: authUser.full_name,
    reviewed_at: new Date().toISOString(),
    review_note: body.note ?? null,
  });
  return send(response, 201, detail(shift, false));
}

module.exports = { handleShiftRequest };
