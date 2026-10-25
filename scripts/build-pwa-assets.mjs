import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function preparePwaAssets(root) {
  const readJson = async (name) =>
    JSON.parse(await readFile(path.join(root, name), "utf8"));
  const prerender = await readJson(".next/prerender-manifest.json");
  if (prerender.routes?.["/offline-pos"]?.initialRevalidateSeconds !== false) {
    throw new Error(
      "PWA requires a static /offline-pos route. Use dynamic = 'error' and a public client shell.",
    );
  }
  const routes = await readJson(".next/server/app-paths-manifest.json");
  if (routes["/offline-pos/page"] !== "app/offline-pos/page.js") {
    throw new Error(
      "PWA shell must live outside the authenticated layout at app/offline-pos/page.tsx.",
    );
  }
  const html = await readFile(
    path.join(root, ".next/server/app/offline-pos.html"),
    "utf8",
  );
  const publicDir = path.join(root, "public/pwa");
  await mkdir(publicDir, { recursive: true });
  const files = [];
  async function collect(directory, prefix, allowed) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const filename = path.join(directory, entry.name);
      const url = `${prefix}/${entry.name}`;
      if (entry.isDirectory()) await collect(filename, url, allowed);
      else if (entry.isFile() && allowed.test(entry.name))
        files.push({ filename, url });
    }
  }
  await collect(
    path.join(root, ".next/static"),
    "/_next/static",
    /\.(?:js|css|woff2?|ttf|otf)$/,
  );
  // Only explicit PWA branding files are public cache inputs; never glob public HTML/JSON.
  for (const name of [
    "icon-192.png",
    "icon-512.png",
    "maskable-192.png",
    "maskable-512.png",
  ]) {
    if (!(await readdir(publicDir)).includes(name))
      throw new Error(`Missing PWA install icon: ${name}`);
    files.push({ filename: path.join(publicDir, name), url: `/pwa/${name}` });
  }
  const urls = new Set(files.map(({ url }) => url));
  for (const match of html.matchAll(/(?:src|href)="([^"\s]+)"/g)) {
    const url = match[1];
    if (url.startsWith("/_next/static/") && !urls.has(url))
      throw new Error(`Missing hydration asset: ${url}`);
    if (
      /^(?:https?:)?\/\//.test(url) &&
      /\.(?:js|css|woff2?)(?:\?|$)/.test(url)
    ) {
      throw new Error("Offline hydration must use same-origin public assets.");
    }
  }
  await writeFile(path.join(publicDir, "offline-pos.html"), html);
  files.push({
    filename: path.join(publicDir, "offline-pos.html"),
    url: "/pwa/offline-pos.html",
  });
  return Promise.all(
    files.map(async ({ filename, url }) => {
      const hash = createHash("sha256")
        .update(await readFile(filename))
        .digest();
      return {
        url,
        revision: hash.toString("hex"),
        integrity: `sha256-${hash.toString("base64")}`,
      };
    }),
  );
}
