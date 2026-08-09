#!/usr/bin/env node
/**
 * Build-time snapshot of the Cloudflare-owned launcher release catalog.
 * Runtime clients read the same endpoint; this file is only an outage fallback.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_CATALOG_URL = "https://api.pcln.top/v1/launcher/releases";
const catalogUrl = process.env.PCLN_RELEASE_CATALOG_URL?.trim() || DEFAULT_CATALOG_URL;
const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "..", "public", "launcher-releases.json");

function fetchWithCurl(url) {
  return execFileSync(
    "curl",
    [
      "--silent",
      "--show-error",
      "--location",
      "--fail",
      "--retry",
      "3",
      "--max-time",
      "45",
      "--header",
      "Accept: application/json",
      url
    ],
    { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 }
  );
}

async function fetchCatalog(url) {
  try {
    return fetchWithCurl(url);
  } catch (curlError) {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      redirect: "follow",
      signal: AbortSignal.timeout(45_000)
    });
    if (!response.ok) {
      throw new Error(
        `${url} -> HTTP ${response.status}; curl=${curlError instanceof Error ? curlError.message : curlError}`
      );
    }
    return response.text();
  }
}

function parseCatalog(text) {
  const payload = JSON.parse(text);
  if (
    !payload ||
    payload.schemaVersion !== 1 ||
    !Array.isArray(payload.versions) ||
    payload.versions.length === 0
  ) {
    throw new Error("Cloudflare launcher release catalog has an invalid shape");
  }
  for (const version of payload.versions) {
    if (
      !version ||
      typeof version.tag !== "string" ||
      !["release", "beta", "ci"].includes(version.channel)
    ) {
      throw new Error("Cloudflare launcher release catalog contains an invalid version");
    }
  }
  return payload;
}

async function main() {
  try {
    const payload = parseCatalog(await fetchCatalog(catalogUrl));
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    console.log(`Wrote ${payload.versions.length} Cloudflare versions -> ${outPath}`);
  } catch (error) {
    if (existsSync(outPath)) {
      const fallback = parseCatalog(readFileSync(outPath, "utf8"));
      console.warn(
        `Cloudflare catalog unavailable; retained ${fallback.versions.length}-version site snapshot:`,
        error instanceof Error ? error.message : error
      );
      return;
    }
    throw error;
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
