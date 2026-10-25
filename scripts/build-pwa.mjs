import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { injectManifest } from "workbox-build";
import { preparePwaAssets } from "./build-pwa-assets.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const entries = await preparePwaAssets(root);
const swSrc = path.join(root, ".next/pwa-worker.js");
await build({
  entryPoints: [path.join(root, "features/pwa/service-worker.mjs")],
  outfile: swSrc,
  bundle: true,
  minify: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  define: { "process.env.NODE_ENV": '"production"' },
});
const result = await injectManifest({
  swSrc,
  swDest: path.join(root, "public/sw.js"),
  globDirectory: root,
  globPatterns: [],
  additionalManifestEntries: entries,
});
if (result.warnings.length) throw new Error(result.warnings.join("\n"));
console.log(
  `PWA: injected ${result.count} public assets, including the static offline POS shell.`,
);
