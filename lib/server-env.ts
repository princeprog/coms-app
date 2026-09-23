export function getComsApiBaseUrl() {
  return (process.env.COMS_API_BASE_URL ?? "http://localhost:3001").replace(
    /\/$/,
    "",
  );
}

export function getAuthGatewayHeaders(): Record<string, string> {
  const secret = process.env.COMS_AUTH_GATEWAY_SECRET;
  if (
    !secret ||
    !/^[a-f0-9]{64}$/i.test(secret) ||
    /^(.{1,16})\1+$/i.test(secret) ||
    new Set(secret.toLowerCase()).size < 8
  ) {
    throw new Error(
      "COMS_AUTH_GATEWAY_SECRET must be a generated 64-character hexadecimal secret",
    );
  }
  return { "X-COMS-Auth-Gateway": secret.toLowerCase() };
}
