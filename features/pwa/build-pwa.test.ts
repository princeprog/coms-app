import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { preparePwaAssets } from "../../scripts/build-pwa-assets.mjs";

const roots: string[] = [];
async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "coms-pwa-test-"));
  roots.push(root);
  const files: Record<string, string> = {
    ".next/prerender-manifest.json": JSON.stringify({
      routes: { "/offline-pos": { initialRevalidateSeconds: false } },
    }),
    ".next/server/app-paths-manifest.json": JSON.stringify({
      "/offline-pos/page": "app/offline-pos/page.js",
    }),
    ".next/server/app/offline-pos.html":
      '<!doctype html><script src="/_next/static/chunks/shell.js"></script>',
    ".next/server/app/pos.html": "PRIVATE HTML",
    ".next/server/app/offline-pos.rsc": "RSC PAYLOAD",
    ".next/static/chunks/shell.js": "public code",
    ".next/static/chunks/lazy.js": "lazy public code",
    ".next/static/css/shell.css": "body{}",
    ".next/static/media/font.woff2": "font",
    ".next/static/chunks/shell.js.map": "SOURCE MAP",
    "public/pwa/icon-192.png": "icon",
    "public/pwa/icon-512.png": "icon",
    "public/pwa/maskable-192.png": "icon",
    "public/pwa/maskable-512.png": "icon",
    "public/private.json": "PRIVATE DATA",
  };
  for (const [name, content] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(root, name)), { recursive: true });
    await writeFile(path.join(root, name), content);
  }
  return root;
}
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("production PWA asset assembly", () => {
  it("includes hydration and lazy chunks but excludes authenticated output and RSC", async () => {
    const entries = await preparePwaAssets(await fixture());
    expect(entries.map((entry: { url: string }) => entry.url).sort()).toEqual([
      "/_next/static/chunks/lazy.js",
      "/_next/static/chunks/shell.js",
      "/_next/static/css/shell.css",
      "/_next/static/media/font.woff2",
      "/pwa/icon-192.png",
      "/pwa/icon-512.png",
      "/pwa/maskable-192.png",
      "/pwa/maskable-512.png",
      "/pwa/offline-pos.html",
    ]);
    expect(
      entries.every((entry: { revision: string }) =>
        /^[a-f0-9]{64}$/.test(entry.revision),
      ),
    ).toBe(true);
    expect(
      entries.every((entry: { integrity?: string }) =>
        /^sha256-[A-Za-z0-9+/]{43}=$/.test(entry.integrity ?? ""),
      ),
    ).toBe(true);
  });
  it("fails closed if the shell is dynamic or authenticated", async () => {
    const root = await fixture();
    await writeFile(
      path.join(root, ".next/prerender-manifest.json"),
      JSON.stringify({ routes: {} }),
    );
    await expect(preparePwaAssets(root)).rejects.toThrow(
      /static.*offline-pos/i,
    );
    await writeFile(
      path.join(root, ".next/prerender-manifest.json"),
      JSON.stringify({
        routes: { "/offline-pos": { initialRevalidateSeconds: false } },
      }),
    );
    await writeFile(
      path.join(root, ".next/server/app-paths-manifest.json"),
      JSON.stringify({
        "/(authenticated)/offline-pos/page":
          "app/(authenticated)/offline-pos/page.js",
      }),
    );
    await expect(preparePwaAssets(root)).rejects.toThrow(
      /outside.*authenticated/i,
    );
  });
  it("rejects missing referenced hydration assets", async () => {
    const root = await fixture();
    await writeFile(
      path.join(root, ".next/server/app/offline-pos.html"),
      '<script src="/_next/static/chunks/missing.js"></script>',
    );
    await expect(preparePwaAssets(root)).rejects.toThrow(/missing.*asset/i);
  });
  it("rejects missing install icons", async () => {
    const root = await fixture();
    await rm(path.join(root, "public/pwa/maskable-512.png"));
    await expect(preparePwaAssets(root)).rejects.toThrow(/missing.*icon/i);
  });
});
