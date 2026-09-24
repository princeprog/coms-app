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
  return { roles: clone(seed.roles), failNext: null };
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
        return send(response, 200, { roles: state.roles });
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
