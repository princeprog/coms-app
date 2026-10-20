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
  const moves = shift.cash_movements;
  const sum = (direction) =>
    text(
      moves
        .filter((m) => m.direction === direction)
        .reduce((s, m) => s + cents(m.amount), 0),
    );
  const hidden = hideCash && shift.status === "OPEN";
  return {
    ...shift,
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

function seedShifts(state, user, openShifts) {
  if (state.shifts) return;
  state.shifts = [];
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
    seedShifts(state, authUser, openShifts);
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
  seedShifts(state, authUser, openShifts);
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
        .map(({ cash_movements: _m, ...shift }) => shift),
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
  if (!action) return send(response, 200, detail(shift, !review));
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
