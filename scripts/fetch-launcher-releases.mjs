#!/usr/bin/env node
/**
 * Build-time scraper: GitHub *web pages only* (no api.github.com).
 * Writes public/launcher-releases.json for the SPA (same-origin, no browser CORS/proxy).
 *
 * Sources:
 *   - https://github.com/PCL-N-Edition/PCL-N/releases.atom
 *   - https://github.com/PCL-N-Edition/PCL-N/releases?page=N
 *   - https://github.com/PCL-N-Edition/PCL-N/releases/expanded_assets/{tag}
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import https from "node:https";
import http from "node:http";

const REPO = "PCL-N-Edition/PCL-N";
const GH = "https://github.com";
const PACKAGE_ASSET = /^PCL_N_(Release|Beta|CI)_/i;
const SKIP_ASSET = /\.(asc|sha256|hdiff|json)$/i;

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "..", "public", "launcher-releases.json");

function detectChannel(tag) {
  const t = String(tag || "").trim();
  if (!t) return null;
  if (/^ci(-|$)/i.test(t) || t.toLowerCase() === "ci-latest") return "ci";
  if (/-release$/i.test(t)) return "release";
  if (/-beta$/i.test(t) || /-rc\d*$/i.test(t) || /beta/i.test(t)) return "beta";
  return "release";
}

function isPackageAsset(name) {
  if (SKIP_ASSET.test(name)) return false;
  return PACKAGE_ASSET.test(name) || /Portable|Installer/i.test(name);
}

function packagingOf(assets) {
  return assets.some(a => /_Installer\.|_Portable\./i.test(a.name)) ? "v2" : "legacy";
}

function supportsPluginChoice(assets) {
  return assets.some(a => /_(WithPlugin|NoPlugin)(\.|_)/i.test(a.name));
}

function labelFor(tag, channel, title) {
  if (channel === "ci") {
    const sha = title?.match(/[0-9a-f]{7,40}/i)?.[0];
    return sha ? `CI ${sha.slice(0, 7)}` : "CI latest";
  }
  const core = tag.replace(/^v/i, "").replace(/-release$/i, "").replace(/-beta$/i, "");
  return channel === "beta" ? `${core} Beta` : core;
}

function compareTagsDesc(a, b) {
  if (a === b) return 0;
  if (/^ci/i.test(a) && !/^ci/i.test(b)) return -1;
  if (/^ci/i.test(b) && !/^ci/i.test(a)) return 1;
  const parse = tag => {
    const m = tag.match(/^v?(\d+)\.(\d+)\.(\d+)(?:[-.](.+))?$/i);
    if (!m) return { major: 0, minor: 0, patch: 0, pre: tag };
    return { major: +m[1], minor: +m[2], patch: +m[3], pre: m[4] ?? "" };
  };
  const pa = parse(a);
  const pb = parse(b);
  if (pa.major !== pb.major) return pb.major - pa.major;
  if (pa.minor !== pb.minor) return pb.minor - pa.minor;
  if (pa.patch !== pb.patch) return pb.patch - pa.patch;
  if (!pa.pre && pb.pre) return -1;
  if (pa.pre && !pb.pre) return 1;
  return pb.pre.localeCompare(pa.pre, undefined, { numeric: true, sensitivity: "base" });
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function fetchTextWithCurl(url) {
  // Prefer curl: more reliable than Node fetch in restricted CI/dev networks.
  return execFileSync(
    "curl",
    [
      "-sL",
      "--fail",
      "--max-time",
      "60",
      "-A",
      "PCL-N-Plugin-Center-Web-release-scraper/1.0",
      "-H",
      "Accept: text/html,application/xhtml+xml,application/atom+xml,text/plain,*/*",
      url
    ],
    { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }
  );
}

function fetchTextWithHttps(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https:") ? https : http;
    const req = lib.get(
      url,
      {
        headers: {
          Accept: "text/html,application/xhtml+xml,application/atom+xml,text/plain,*/*",
          "User-Agent": "PCL-N-Plugin-Center-Web-release-scraper/1.0"
        }
      },
      res => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchTextWithHttps(res.headers.location).then(resolve, reject);
          return;
        }
        if ((res.statusCode ?? 500) >= 400) {
          reject(new Error(`${url} -> HTTP ${res.statusCode}`));
          res.resume();
          return;
        }
        const chunks = [];
        res.on("data", c => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      }
    );
    req.on("error", reject);
    req.setTimeout(60000, () => {
      req.destroy(new Error(`timeout ${url}`));
    });
  });
}

async function fetchText(url) {
  try {
    return fetchTextWithCurl(url);
  } catch (curlErr) {
    try {
      return await fetchTextWithHttps(url);
    } catch (httpsErr) {
      throw new Error(
        `${url} failed (curl: ${curlErr?.message ?? curlErr}; https: ${httpsErr?.message ?? httpsErr})`
      );
    }
  }
}

function parseTags(text) {
  const found = new Map();
  const htmlRe = /\/PCL-N-Edition\/PCL-N\/releases\/tag\/([^"'?\s#]+)/gi;
  let m;
  while ((m = htmlRe.exec(text)) !== null) {
    const tag = decodeURIComponent(m[1]);
    if (!found.has(tag)) found.set(tag, tag);
  }
  const atomRe =
    /<entry>[\s\S]*?<link[^>]+href="[^"]*\/releases\/tag\/([^"]+)"[\s\S]*?<title>([^<]*)<\/title>[\s\S]*?<\/entry>/gi;
  while ((m = atomRe.exec(text)) !== null) {
    found.set(decodeURIComponent(m[1]), decodeHtmlEntities(m[2].trim()));
  }
  return [...found.entries()].map(([tag, title]) => ({ tag, title }));
}

function parseAssets(tag, html) {
  const assets = [];
  const seen = new Set();
  const re = /\/PCL-N-Edition\/PCL-N\/releases\/download\/([^/"'\s]+)\/([^"'?\s#]+)/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const name = decodeURIComponent(m[2]);
    if (!isPackageAsset(name) || seen.has(name)) continue;
    seen.add(name);
    assets.push({
      name,
      browser_download_url: `${GH}/${REPO}/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(name)}`
    });
  }
  return assets;
}

async function main() {
  const merged = new Map();

  try {
    for (const item of parseTags(await fetchText(`${GH}/${REPO}/releases.atom`))) {
      merged.set(item.tag, item.title);
    }
  } catch (e) {
    console.warn("atom:", e.message);
  }

  for (const page of [1, 2, 3, 4, 5]) {
    try {
      const url = page === 1 ? `${GH}/${REPO}/releases` : `${GH}/${REPO}/releases?page=${page}`;
      const batch = parseTags(await fetchText(url));
      if (!batch.length) break;
      for (const item of batch) if (!merged.has(item.tag)) merged.set(item.tag, item.title);
      if (batch.length < 5) break;
    } catch (e) {
      console.warn(`releases page ${page}:`, e.message);
      break;
    }
  }

  if (!merged.has("ci-latest")) merged.set("ci-latest", "CI latest");

  const tags = [...merged.entries()]
    .map(([tag, title]) => ({ tag, title }))
    .sort((a, b) => compareTagsDesc(a.tag, b.tag));

  console.log(`Found ${tags.length} tags from GitHub web pages`);

  const versions = [];
  const concurrency = 6;
  for (let i = 0; i < tags.length; i += concurrency) {
    const chunk = tags.slice(i, i + concurrency);
    const results = await Promise.all(
      chunk.map(async item => {
        const channel = detectChannel(item.tag);
        if (!channel) return null;
        let packageAssets = [];
        try {
          packageAssets = parseAssets(
            item.tag,
            await fetchText(`${GH}/${REPO}/releases/expanded_assets/${encodeURIComponent(item.tag)}`)
          );
        } catch (e) {
          console.warn(`assets ${item.tag}:`, e.message);
        }
        if (packageAssets.length === 0 && channel !== "ci") return null;
        return {
          id: item.tag,
          label: labelFor(item.tag, channel, item.title),
          tag: item.tag,
          channel,
          packaging: packagingOf(packageAssets),
          supportsPluginChoice: supportsPluginChoice(packageAssets),
          packageAssets
        };
      })
    );
    for (const v of results) if (v) versions.push(v);
    process.stdout.write(`\rprobed ${Math.min(i + concurrency, tags.length)}/${tags.length}`);
  }
  console.log("");

  versions.sort((a, b) => {
    const order = { release: 0, beta: 1, ci: 2 };
    if (a.channel !== b.channel) return order[a.channel] - order[b.channel];
    return compareTagsDesc(a.tag, b.tag);
  });

  if (!versions.some(v => v.channel === "ci")) {
    versions.push({
      id: "ci-latest",
      label: "CI latest",
      tag: "ci-latest",
      channel: "ci",
      packaging: "legacy",
      supportsPluginChoice: false,
      packageAssets: []
    });
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    source: "github-web-html",
    versions
  };

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(`Wrote ${versions.length} versions -> ${outPath}`);
  const beta = versions.find(v => v.channel === "beta");
  const release = versions.find(v => v.channel === "release");
  console.log(`latest beta=${beta?.tag ?? "—"} release=${release?.tag ?? "—"}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
