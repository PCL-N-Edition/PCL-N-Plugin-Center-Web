import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const appShell = resolve("dist", "index.html");

// GitHub Pages has no rewrite rules. Give crawlable public routes a real
// index.html so they return HTTP 200, then keep 404.html as the fallback for
// OAuth callbacks and other client-side routes.
for (const route of ["download", "market"]) {
  const directory = resolve("dist", route);
  await mkdir(directory, { recursive: true });
  await copyFile(appShell, resolve(directory, "index.html"));
}

await copyFile(appShell, resolve("dist", "404.html"));
