const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DECIMAL = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;
const SIGNED_DECIMAL = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;

function uuid(prefix, sequence) {
  return `${prefix}-0000-4000-8000-${String(sequence).padStart(12, "0")}`;
}

function parts(value) {
  const negative = value.startsWith("-");
  const [whole, fraction = ""] = value.replace(/^-/, "").split(".");
  const digits = BigInt(whole + fraction) * (negative ? -1n : 1n);
  return { digits, scale: fraction.length };
}

function decimalText(digits, scale) {
  const negative = digits < 0n;
  const absolute = negative ? -digits : digits;
  let value = String(absolute).padStart(scale + 1, "0");
  if (scale > 0) {
    const split = value.length - scale;
    value = `${value.slice(0, split)}.${value.slice(split)}`;
    value = value.replace(/0+$/, "").replace(/\.$/, "");
  }
  return `${negative ? "-" : ""}${value}`;
}

function sum(left, right) {
  const a = parts(left);
  const b = parts(right);
  const scale = Math.max(a.scale, b.scale);
  return decimalText(
    a.digits * 10n ** BigInt(scale - a.scale) +
      b.digits * 10n ** BigInt(scale - b.scale),
    scale,
  );
}

function negate(value) {
  const parsed = parts(value);
  return decimalText(-parsed.digits, parsed.scale);
}

function isZero(value) {
  return parts(value).digits === 0n;
}

function normalize(value) {
  const negative = value.startsWith("-");
  const [wholeValue, fractionValue = ""] = value.replace(/^-/, "").split(".");
  const whole = wholeValue.replace(/^0+(?=\d)/, "");
  const fraction = fractionValue.replace(/0+$/, "");
  const result = `${whole}${fraction ? `.${fraction}` : ""}`;
  return negative && result !== "0" ? `-${result}` : result;
}

function timestamp(sequence) {
  return new Date(
    Date.parse("2026-09-25T02:00:00.000Z") + sequence * 60_000,
  ).toISOString();
}

function makeItems(stockItems, reportIndex, editable) {
  return stockItems.slice(0, 2).map((stockItem, itemIndex) => {
    const ledger = itemIndex === 0 ? "11" : "6";
    const physical = editable ? null : ledger;
    return {
      id: uuid("6a000000", reportIndex * 2 + itemIndex + 1),
      stock_item_id: stockItem.id,
      stock_item_name: stockItem.stock_item_name,
      unit: stockItem.unit,
      opening_quantity: itemIndex === 0 ? "10.000" : "5",
      receipt_quantity: itemIndex === 0 ? "2" : "1.5",
      sale_consumption_quantity: itemIndex === 0 ? "1.5" : "0.75",
      sale_void_reversal_quantity: itemIndex === 0 ? "0.5" : "0",
      ledger_adjustment_quantity: "0",
      ledger_closing_quantity: ledger,
      waste_quantity: "0",
      waste_reason: null,
      adjustment_quantity: "0",
      adjustment_reason: null,
      expected_closing_quantity: ledger,
      physical_closing_quantity: physical,
      variance_quantity: editable ? null : "0",
    };
  });
}

function makeReport({ branch, stockItems, seed, index, status, date }) {
  const id = uuid("69000000", index + 1);
  const createdAt = timestamp(index);
  const submitted = status !== "DRAFT";
  const reviewed = status === "RETURNED" || status === "APPROVED";
  const report = {
    id,
    branch_id: branch.id,
    business_date: date,
    status,
    idempotency_key: uuid("6c000000", index + 1),
    created_by_user_id: seed.user.id,
    submitted_by_user_id: submitted ? seed.user.id : null,
    submitted_at: submitted ? createdAt : null,
    reviewed_by_user_id: reviewed ? seed.user.id : null,
    reviewed_at: reviewed ? timestamp(index + 1) : null,
    return_reason:
      status === "RETURNED"
        ? "Please verify the physical count and unit."
        : null,
    created_at: createdAt,
    updated_at: reviewed ? timestamp(index + 1) : createdAt,
    items: makeItems(stockItems, index, status === "DRAFT"),
    events: [],
  };
  report.events.push({
    id: uuid("6b000000", index * 3 + 1),
    event_type: "CREATED",
    actor_user_id: seed.user.id,
    actor_name: "Fixture Branch Manager",
    note: null,
    created_at: createdAt,
  });
  if (submitted) {
    report.events.push({
      id: uuid("6b000000", index * 3 + 2),
      event_type: "SUBMITTED",
      actor_user_id: seed.user.id,
      actor_name: "Fixture Branch Manager",
      note: null,
      created_at: createdAt,
    });
  }
  if (reviewed) {
    report.events.push({
      id: uuid("6b000000", index * 3 + 3),
      event_type: status,
      actor_user_id: seed.user.id,
      actor_name: "Fixture Operations Lead",
      note: report.return_reason,
      created_at: timestamp(index + 1),
    });
  }
  return report;
}

function createDailyReportSeed({ branches, stockItems, seed }) {
  const branch = branches[0];
  const statuses = ["DRAFT", "SUBMITTED", "RETURNED", "APPROVED"];
  return Array.from({ length: 26 }, (_, index) => {
    const day = new Date(
      Date.parse("2026-09-23T00:00:00.000Z") - index * 86_400_000,
    )
      .toISOString()
      .slice(0, 10);
    return makeReport({
      branch,
      stockItems,
      seed,
      index,
      status: statuses[index % statuses.length],
      date: day,
    });
  });
}

function listItem(report) {
  const value = { ...report };
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

function touch(state, report, type, note = null) {
  const now = timestamp(state.dailyReportEventSequence++);
  report.updated_at = now;
  report.events.push({
    id: uuid("6b000000", 1000 + state.dailyReportEventSequence),
    event_type: type,
    actor_user_id: state.fixtureUserId,
    actor_name: "Fixture Operations Lead",
    note,
    created_at: now,
  });
}

function handleDailyReportRequest({
  request,
  response,
  url,
  body,
  state,
  seed,
}) {
  const route = url.pathname.match(
    /^\/branches\/([0-9a-f-]{36})\/daily-reports(?:\/([0-9a-f-]{36})(?:\/(submit|return|approve))?)?$/i,
  );
  if (!route) return false;
  const [, branchId, reportId, action] = route;
  const branch = state.branches.find((item) => item.id === branchId);
  if (!branch) return send(response, 404, { message: "Branch not found." });

  if (request.method === "GET" && !reportId) {
    const status = url.searchParams.get("status");
    const reports = state.dailyReports
      .filter(
        (report) =>
          report.branch_id === branch.id &&
          (!status || report.status === status),
      )
      .sort((left, right) =>
        right.business_date.localeCompare(left.business_date),
      );
    return send(response, 200, pageItems(reports.map(listItem), url));
  }
  if (!reportId) {
    if (request.method !== "POST")
      return send(response, 405, { message: "Method not allowed." });
    const key = request.headers["idempotency-key"];
    if (
      !UUID.test(key ?? "") ||
      !/^\d{4}-\d{2}-\d{2}$/.test(body?.business_date ?? "")
    )
      return send(response, 400, {
        message: "Choose a valid report date and idempotency key.",
      });
    const existingKey = state.dailyReportActionKeys.find(
      (entry) => entry.key === key,
    );
    if (existingKey) {
      if (
        existingKey.branchId !== branch.id ||
        existingKey.date !== body.business_date
      )
        return send(response, 409, { message: "Idempotency key conflict." });
      const existing = state.dailyReports.find(
        (report) => report.id === existingKey.reportId,
      );
      return send(response, 201, existing);
    }
    if (
      state.dailyReports.some(
        (report) =>
          report.branch_id === branch.id &&
          report.business_date === body.business_date,
      )
    )
      return send(response, 409, {
        message: "A report already exists for this date.",
      });
    const index = state.dailyReports.length + 1;
    const report = makeReport({
      branch,
      stockItems: state.stockItems.filter((item) => item.is_active).slice(0, 2),
      seed,
      index,
      status: "DRAFT",
      date: body.business_date,
    });
    state.dailyReports.push(report);
    state.dailyReportActionKeys.push({
      key,
      branchId: branch.id,
      date: body.business_date,
      reportId: report.id,
    });
    return send(response, 201, report);
  }

  const report = state.dailyReports.find(
    (item) => item.id === reportId && item.branch_id === branch.id,
  );
  if (!report) return send(response, 404, { message: "Report not found." });
  if (request.method === "GET" && !action) return send(response, 200, report);

  if (request.method === "PUT" && !action) {
    if (report.status !== "DRAFT" && report.status !== "RETURNED")
      return send(response, 409, {
        message: "Only editable reports can be changed.",
      });
    if (
      !Array.isArray(body?.items) ||
      body.items.length !== report.items.length
    )
      return send(response, 400, {
        message: "Enter every report item exactly once.",
      });
    const seen = new Set();
    for (const value of body.items) {
      if (
        !UUID.test(value?.stock_item_id ?? "") ||
        seen.has(value.stock_item_id) ||
        !DECIMAL.test(value.physical_closing_quantity ?? "") ||
        !DECIMAL.test(value.waste_quantity ?? "") ||
        !SIGNED_DECIMAL.test(value.adjustment_quantity ?? "")
      )
        return send(response, 400, { message: "Invalid report count values." });
      seen.add(value.stock_item_id);
      if (!isZero(value.waste_quantity) && !value.waste_reason?.trim())
        return send(response, 400, { message: "A waste reason is required." });
      if (
        !isZero(value.adjustment_quantity) &&
        !value.adjustment_reason?.trim()
      )
        return send(response, 400, {
          message: "An adjustment reason is required.",
        });
    }
    if (report.items.some((item) => !seen.has(item.stock_item_id)))
      return send(response, 400, { message: "A report item is missing." });
    for (const value of body.items) {
      const item = report.items.find(
        (candidate) => candidate.stock_item_id === value.stock_item_id,
      );
      item.physical_closing_quantity = normalize(
        value.physical_closing_quantity,
      );
      item.waste_quantity = normalize(value.waste_quantity);
      item.waste_reason = value.waste_reason?.trim() || null;
      item.adjustment_quantity = normalize(value.adjustment_quantity);
      item.adjustment_reason = value.adjustment_reason?.trim() || null;
      item.expected_closing_quantity = sum(
        sum(item.ledger_closing_quantity, negate(item.waste_quantity)),
        item.adjustment_quantity,
      );
      item.variance_quantity = sum(
        item.physical_closing_quantity,
        negate(item.expected_closing_quantity),
      );
    }
    touch(state, report, "UPDATED");
    return send(response, 200, report);
  }

  if (request.method === "POST" && action === "submit") {
    if (
      (report.status !== "DRAFT" && report.status !== "RETURNED") ||
      report.items.some((item) => item.physical_closing_quantity === null)
    )
      return send(response, 409, {
        message: "Complete every count before submission.",
      });
    report.status = "SUBMITTED";
    report.submitted_by_user_id = seed.user.id;
    report.submitted_at = timestamp(state.dailyReportEventSequence++);
    report.reviewed_by_user_id = null;
    report.reviewed_at = null;
    report.return_reason = null;
    touch(state, report, "SUBMITTED");
    return send(response, 200, report);
  }
  if (request.method === "POST" && action === "return") {
    const reason = body?.reason?.trim();
    if (report.status !== "SUBMITTED" || !reason || reason.length > 500)
      return send(response, 400, { message: "A return reason is required." });
    report.status = "RETURNED";
    report.reviewed_by_user_id = seed.user.id;
    report.reviewed_at = timestamp(state.dailyReportEventSequence++);
    report.return_reason = reason;
    touch(state, report, "RETURNED", reason);
    return send(response, 200, report);
  }
  if (request.method === "POST" && action === "approve") {
    if (report.status !== "SUBMITTED")
      return send(response, 409, {
        message: "Only submitted reports can be approved.",
      });
    report.status = "APPROVED";
    report.reviewed_by_user_id = seed.user.id;
    report.reviewed_at = timestamp(state.dailyReportEventSequence++);
    touch(state, report, "APPROVED");
    return send(response, 200, report);
  }
  return send(response, 405, { message: "Method not allowed." });
}

function send(response, status, payload) {
  response.writeHead(status, {
    "cache-control": "no-store",
    "content-type": "application/json",
  });
  response.end(JSON.stringify(payload));
}

module.exports = { createDailyReportSeed, handleDailyReportRequest };
