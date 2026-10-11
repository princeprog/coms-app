// Loopback-only synthetic preview of the selected dispatch detail concept.
const { spawn } = require("node:child_process");
const crypto = require("node:crypto");
const net = require("node:net");
const path = require("node:path");
const seed = require("./fixtures/operational-api.json");
const dispatchFixture = require("./fixtures/dispatch-fixture.cjs");
const originalSeed = dispatchFixture.createDispatchSeed;
const id = (sequence) =>
  `98000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`;

dispatchFixture.createDispatchSeed = (...args) => {
  const dispatches = originalSeed(...args);
  const dispatch = dispatches.find(
    (entry) => entry.discrepancy?.status === "OPEN",
  );
  const timestamp = (time) => `2026-10-07T${time}:00.000Z`;
  const created = timestamp("00:35");
  const sent = timestamp("00:40");
  const received = timestamp("01:20");
  const reported = timestamp("01:25");
  const template = dispatch.items[0];
  dispatch.branch_name = "Manila North";
  dispatch.created_at = created;
  dispatch.dispatched_at = sent;
  dispatch.updated_at = reported;
  dispatch.created_by_name = dispatch.dispatched_by_name = "Morgan Lee";
  dispatch.items = [
    {
      name: "Flour",
      unit: "kg",
      sent: "50.00",
      received: "30.00",
      transit: "20.00",
    },
    {
      name: "Cooking oil",
      unit: "L",
      sent: "20.00",
      received: "20.00",
      transit: "0.00",
    },
    {
      name: "Paper boxes",
      unit: "pcs",
      sent: "200",
      received: "200",
      transit: "0",
    },
  ].map((line, index) => ({
    ...template,
    id: id(index + 1),
    stock_item_id: id(index + 10),
    stock_item_name: line.name,
    unit: line.unit,
    quantity_dispatched: line.sent,
    quantity_received: line.received,
    quantity_shortage_closed: index === 2 ? "0" : "0.00",
    quantity_in_transit: line.transit,
  }));
  dispatch.receipts = [
    {
      id: id(20),
      received_by_user_id: seed.user.id,
      receiver_name: "Alex Cruz",
      created_at: received,
      items: dispatch.items.map((line, index) => ({
        receipt_item_id: id(index + 30),
        dispatch_item_id: line.id,
        stock_item_id: line.stock_item_id,
        stock_item_name: line.stock_item_name,
        unit: line.unit,
        quantity_received: line.quantity_received,
      })),
    },
  ];
  dispatch.shortage_closures = [];
  dispatch.events = [
    { type: "CREATED", at: created, actor: "Morgan Lee", receipt: null },
    { type: "DISPATCHED", at: sent, actor: "Morgan Lee", receipt: null },
    {
      type: "RECEIPT_RECORDED",
      at: received,
      actor: "Alex Cruz",
      receipt: id(20),
    },
  ].map((entry, index) => ({
    id: id(index + 40),
    event_type: entry.type,
    actor_user_id: seed.user.id,
    actor_name: entry.actor,
    dispatch_receipt_id: entry.receipt,
    shortage_closure_id: null,
    created_at: entry.at,
  }));
  dispatch.discrepancy.reported_by_name = "Alex Cruz";
  dispatch.discrepancy.reported_at = reported;
  dispatch.discrepancy_events = [
    {
      id: id(50),
      event_type: "REPORTED",
      actor_user_id: seed.user.id,
      actor_name: "Alex Cruz",
      note: "Two bags of flour were missing from the delivery. Please verify the remaining 20 kg.",
      created_at: reported,
    },
  ];
  return dispatches;
};

const {
  createOperationalApiFixture,
} = require("./operational-api-fixture.cjs");
const root = path.resolve(__dirname, "..");
async function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}

async function startPreview() {
  const gatewaySecret = crypto.randomBytes(32).toString("hex");
  const authUser = structuredClone(seed.user);
  authUser.permissions.push("dispatches.reconcile");
  const fixture = await createOperationalApiFixture({
    gatewaySecret,
    authUser,
  });
  const port = await freePort();
  const server = spawn(
    process.execPath,
    [
      path.join(root, "node_modules/next/dist/bin/next"),
      "start",
      "-p",
      String(port),
      "-H",
      "127.0.0.1",
    ],
    {
      cwd: root,
      env: {
        ...process.env,
        COMS_API_BASE_URL: fixture.baseUrl,
        COMS_AUTH_GATEWAY_SECRET: gatewaySecret,
      },
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let output = "";
  for (const stream of [server.stdout, server.stderr])
    stream.on("data", (chunk) => {
      output = (output + chunk.toString()).slice(-8000);
    });
  const baseUrl = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(output);
    try {
      if ((await fetch(baseUrl, { redirect: "manual" })).status < 500) break;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return {
    fixture,
    server,
    baseUrl,
    detailUrl: `${baseUrl}/dispatches/36000000-0000-4000-8000-000000000003`,
    close: async () => {
      server.kill();
      await fixture.close();
    },
    output: () => output,
  };
}

if (require.main === module) {
  startPreview()
    .then((preview) => {
      console.log(
        JSON.stringify({
          baseUrl: preview.baseUrl,
          detailUrl: preview.detailUrl,
        }),
      );
      process.once("SIGINT", () => preview.close().then(() => process.exit(0)));
      process.once("SIGTERM", () =>
        preview.close().then(() => process.exit(0)),
      );
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
module.exports = { startPreview };
