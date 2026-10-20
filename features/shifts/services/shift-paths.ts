/** Only same-app paths are accepted as a destination after starting a shift. */
export function safeReturnPath(value: string | undefined, fallback: string) {
  return value && value.startsWith("/") && !value.startsWith("//")
    ? value
    : fallback;
}

export function posHref(branchId: string) {
  return `/pos?branch=${branchId}`;
}
