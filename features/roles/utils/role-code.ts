const MAX_ROLE_CODE_LENGTH = 50;

export function generateRoleCode(roleName: string): string {
  const code = roleName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, MAX_ROLE_CODE_LENGTH)
    .replace(/_+$/g, "");

  return code.length === 1 ? `${code}_ROLE` : code;
}
