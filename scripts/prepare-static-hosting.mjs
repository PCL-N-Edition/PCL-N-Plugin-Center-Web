import { copyFile, mkdir, access } from "node:fs/promises";
import { resolve } from "node:path";

/**
 * Prepare static hosting artifacts after Vite build.
 *
 * Cloudflare Pages: `public/_redirects` already provides SPA fallback
 * (`/* → /index.html 200`). Materialized route shells still help crawlers
 * and keep deep links working if redirects are misconfigured.
 *
 * Also works for GitHub Pages (no native SPA rewrite) via directory/index.html
 * and 404.html shell.
 *
 * Works for both flat `dist/` and `dist/client/` (build:sites).
 */
const roots = [];
for (const candidate of [resolve("dist", "client"), resolve("dist")]) {
  try {
    await access(resolve(candidate, "index.html"));
    roots.push(candidate);
  } catch {
    // skip missing root
  }
}

if (!roots.length) {
  throw new Error("prepare-static-hosting: no dist/index.html or dist/client/index.html found");
}

// Materialize SPA shells for important public/auth deep links.
const publicRoutes = [
  "login",
  "download",
  "download/thanks",
  "market",
  "account",
  "legal/accept",
  "auth/callback",
  "desktop/authorize"
];

for (const root of roots) {
  const appShell = resolve(root, "index.html");
  for (const route of publicRoutes) {
    const directory = resolve(root, route);
    await mkdir(directory, { recursive: true });
    await copyFile(appShell, resolve(directory, "index.html"));
  }
  // Custom 404 serves the SPA shell so unknown paths still boot the router
  // (GitHub Pages / some static hosts). Cloudflare uses _redirects primarily.
  await copyFile(appShell, resolve(root, "404.html"));
  console.log(`SPA routes + 404.html prepared under ${root}`);
}
