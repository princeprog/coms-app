type SafetyCheck = () => boolean | Promise<boolean>;
const checks = { cart: new Set<SafetyCheck>(), outbox: new Set<SafetyCheck>() };

export function registerPwaUpdateSafetyCheck(
  owner: keyof typeof checks,
  check: SafetyCheck,
) {
  // A wrapper preserves independently mounted registrations of the same callback.
  const registered = () => check();
  checks[owner].add(registered);
  return () => {
    checks[owner].delete(registered);
  };
}

export async function checkUpdateSafety(): Promise<boolean> {
  if (!checks.cart.size || !checks.outbox.size) return false;
  const snapshot = [...checks.cart, ...checks.outbox];
  try {
    const results = await Promise.all(snapshot.map((check) => check()));
    // An owner unmounting during the read invalidates its approval.
    return (
      checks.cart.size > 0 &&
      checks.outbox.size > 0 &&
      snapshot.length === checks.cart.size + checks.outbox.size &&
      snapshot.every(
        (check) => checks.cart.has(check) || checks.outbox.has(check),
      ) &&
      results.every((safe) => safe === true)
    );
  } catch {
    return false;
  }
}
