import { ApiRequestError } from "@/services/api-services";

export const AUTH_LOCK_NAME = "coms-auth-session";
const AUTH_CHANNEL = "coms-auth-events";

export function supportsAuthLock(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.locks?.request === "function"
  );
}

export async function withAuthLock<T>(operation: () => Promise<T>): Promise<T> {
  if (!supportsAuthLock()) return operation();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  let acquired = false;
  try {
    return await navigator.locks.request(
      AUTH_LOCK_NAME,
      { mode: "exclusive", signal: controller.signal },
      async () => {
        acquired = true;
        clearTimeout(timer); // The timeout cancels only waiting; never steal an active lock.
        return operation();
      },
    );
  } catch (error) {
    if (!acquired && controller.signal.aborted)
      throw new ApiRequestError(
        "Another sign-in operation is still running. Try again.",
        408,
      );
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export function announceLogout(): void {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined")
    return;
  let channel: BroadcastChannel | undefined;
  try {
    channel = new BroadcastChannel(AUTH_CHANNEL);
    channel.postMessage({ type: "logout" });
  } catch {
    // Browser privacy policies may block messaging. Server logout already succeeded.
  } finally {
    channel?.close();
  }
}

export function subscribeToLogout(callback: () => void): () => void {
  if (typeof BroadcastChannel === "undefined") return () => {};
  let channel: BroadcastChannel;
  try {
    channel = new BroadcastChannel(AUTH_CHANNEL);
  } catch {
    return () => {};
  }
  channel.onmessage = (event: MessageEvent<unknown>) => {
    if (
      typeof event.data === "object" &&
      event.data !== null &&
      "type" in event.data &&
      event.data.type === "logout"
    )
      callback();
  };
  return () => channel.close();
}
