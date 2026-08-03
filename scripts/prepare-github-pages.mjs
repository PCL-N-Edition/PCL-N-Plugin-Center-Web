import { copyFile, mkdir, access } from "node:fs/promises";
import { resolve } from "node:path";

/**
 * GitHub Pages has no SPA rewrite. Materialize history-mode routes as
 * directory/index.html and set 404.html to the app shell so deep links work.
 *
 * Works for both flat `dist/` (pages.yml) and `dist/client/` (build:sites).
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
  throw new Error("prepare-github-pages: no dist/index.html or dist/client/index.html found");
}

const publicRoutes = [
  "login",
  "download",
  "download/thanks",
  "market",
  "account",
  "legal/accept",
  "desktop/authorize"
];

for (const root of roots) {
  const appShell = resolve(root, "index.html");
  for (const route of publicRoutes) {
    const directory = resolve(root, route);
    await mkdir(directory, { recursive: true });
    await copyFile(appShell, resolve(directory, "index.html"));
  }
  // Custom 404 serves the SPA shell so unknown paths still boot the router.
  await copyFile(appShell, resolve(root, "404.html"));
  console.log(`SPA routes + 404.html prepared under ${root}`);
}
