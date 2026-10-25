import { checkUpdateSafety } from "./update-safety";

export type PwaOfflineStatus = {
  ready: boolean;
  cachedAssets: number;
  totalAssets: number;
};
export const unavailableStatus: PwaOfflineStatus = {
  ready: false,
  cachedAssets: 0,
  totalAssets: 0,
};
export const PWA_STATUS_EVENT = "coms:pwa-status";

export function workerRequest<T>(
  worker: ServiceWorker,
  type: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => {
      channel.port1.close();
      reject(new Error("COMS update check timed out."));
    }, 6000);
    channel.port1.onmessage = (event: MessageEvent<T>) => {
      clearTimeout(timer);
      channel.port1.close();
      resolve(event.data);
    };
    try {
      worker.postMessage({ type }, [channel.port2]);
    } catch (error) {
      clearTimeout(timer);
      channel.port1.close();
      reject(error);
    }
  });
}

export async function getPwaOfflineStatus(): Promise<PwaOfflineStatus> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator))
    return unavailableStatus;
  const worker = (await navigator.serviceWorker.getRegistration("/"))?.active;
  if (!worker) return unavailableStatus;
  try {
    const result = await workerRequest<PwaOfflineStatus>(
      worker,
      "COMS_PWA_STATUS",
    );
    if (
      typeof result.ready !== "boolean" ||
      !Number.isInteger(result.cachedAssets) ||
      !Number.isInteger(result.totalAssets)
    )
      return unavailableStatus;
    return {
      ready: result.ready,
      cachedAssets: result.cachedAssets,
      totalAssets: result.totalAssets,
    };
  } catch {
    return unavailableStatus;
  }
}

export async function registerPwa(): Promise<ServiceWorkerRegistration | null> {
  if (
    process.env.NODE_ENV !== "production" ||
    typeof navigator === "undefined" ||
    !("serviceWorker" in navigator) ||
    !window.isSecureContext
  )
    return null;
  return navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "none",
  });
}

export function respondToUpdateSafety(event: MessageEvent) {
  if (event.data?.type !== "COMS_PWA_CHECK_UPDATE_SAFETY" || !event.ports[0])
    return;
  void checkUpdateSafety().then((safe) => event.ports[0].postMessage({ safe }));
}
