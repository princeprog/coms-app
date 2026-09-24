const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const seed = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "fixtures", "operational-api.json"),
    "utf8",
  ),
);

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

function send(response, status, payload, headers = {}) {
  response.writeHead(status, {
    "cache-control": "no-store",
    ...(payload === undefined ? {} : { "content-type": "application/json" }),
    ...headers,
  });
  response.end(payload === undefined ? undefined : JSON.stringify(payload));
}

function createState() {
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
  return { roles: clone(seed.roles), branches, staff, failNext: null };
}

function createOperationalApiFixture({ gatewaySecret }) {
  if (!gatewaySecret || !/^[a-f0-9]{64}$/i.test(gatewaySecret)) {
    throw new Error(
      "The operational fixture requires a generated gateway secret.",
    );
  }

  let state = createState();
  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");

    try {
      const body = await readJson(request);

      if (url.pathname === "/__fixture/reset" && request.method === "POST") {
        state = createState();
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
          staff: state.staff,
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
      const userResponse = clone(seed.user);

      if (url.pathname === "/auth/login" && request.method === "POST") {
        if (
          body?.email?.toLowerCase() !== seed.login.email ||
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
        if (state.branches.some((branch) => branch.code === body?.code)) {
          return send(response, 409, {
            message: "Branch code already exists.",
          });
        }
        const sequence = String(state.branches.length + 1).padStart(12, "0");
        const id = `10000000-0000-4000-8000-${sequence}`;
        state.branches.push({
          id,
          code: body.code,
          branch_name: body.branch_name,
          address: body.address ?? null,
          date_opened: body.date_opened ?? null,
          has_dine_in: body.has_dine_in,
          status: "active",
        });
        return send(response, 201, { id });
      }

      if (url.pathname === "/staff" && request.method === "GET") {
        const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
        const pageSize = Math.min(
          100,
          Math.max(1, Number(url.searchParams.get("page_size")) || 25),
        );
        const branchId = url.searchParams.get("branch_id");
        const search = (url.searchParams.get("search") ?? "")
          .trim()
          .toLowerCase();
        const matches = state.staff.filter((member) => {
          if (branchId && !member.branch_ids.includes(branchId)) return false;
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
        const role = state.roles.find(
          (item) => item.id === String(body?.role_id),
        );
        if (!role || role.code === "SUPER_ADMIN") {
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
          role_id: role.id,
          role_code: role.code,
          role_name: role.role_name,
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
          const role = state.roles.find(
            (item) => item.id === String(body?.role_id),
          );
          if (!role || role.code === "SUPER_ADMIN") {
            return send(response, 400, { message: "Invalid staff role." });
          }
          member.role_id = role.id;
          member.role_code = role.code;
          member.role_name = role.role_name;
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
