#!/usr/bin/env node
/**
 * Same discovery model as PCL.Application LauncherUpdateService:
 *   - Atom:  https://github.com/{owner}/{repo}/releases.atom
 *   - Latest: https://github.com/{owner}/{repo}/releases/latest  (Location → stable tag)
 *   - Assets: convention URLs only (no REST API, no expanded_assets listing)
 *
 * Writes public/launcher-releases.json for the SPA (same-origin load).
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import https from "node:https";
import http from "node:http";

// Match production releases host (LauncherUpdateService defaults redirect here).
const OWNER = "PCL-N-Edition";
const REPO = "PCL-N";
const GH = "https://github.com";
const CI_TAG = "ci-latest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "..", "public", "launcher-releases.json");

function fetchTextWithCurl(url, extraArgs = []) {
  return execFileSync(
    "curl",
    [
      "-sL",
      "--fail",
      "--max-time",
      "45",
      "-A",
      "PCL-N/1.0",
      "-H",
      "Accept: application/atom+xml,text/html,application/xhtml+xml,*/*",
      ...extraArgs,
      url
    ],
    { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }
  );
}

/** curl -I without following redirects (read Location for /releases/latest). */
function fetchHeadersWithCurl(url) {
  return execFileSync(
    "curl",
    [
      "-sI",
      "--max-time",
      "30",
      "-A",
      "PCL-N/1.0",
      url
    ],
    { encoding: "utf8", maxBuffer: 1024 * 1024 }
  );
}

function fetchTextWithHttps(url, redirectLeft = 6) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https:") ? https : http;
    const req = lib.get(
      url,
      {
        headers: {
          Accept: "application/atom+xml,text/html,*/*",
          "User-Agent": "PCL-N/1.0"
        }
      },
      res => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          if (redirectLeft <= 0) {
            reject(new Error("too many redirects"));
            res.resume();
            return;
          }
          const next = new URL(res.headers.location, url).href;
          res.resume();
          fetchTextWithHttps(next, redirectLeft - 1).then(resolve, reject);
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
    req.setTimeout(45000, () => req.destroy(new Error(`timeout ${url}`)));
  });
}

async function fetchText(url) {
  try {
    return fetchTextWithCurl(url);
  } catch (e1) {
    try {
      return await fetchTextWithHttps(url);
    } catch (e2) {
      throw new Error(`${url} failed (${e1.message}; ${e2.message})`);
    }
  }
}

function normalizeVersion(value) {
  let trimmed = String(value || "").trim();
  if (trimmed.startsWith("v") || trimmed.startsWith("V")) trimmed = trimmed.slice(1);
  const plus = trimmed.indexOf("+");
  if (plus >= 0) trimmed = trimmed.slice(0, plus);
  trimmed = trimmed.replace(/_/g, "-");
  const space = trimmed.indexOf(" ");
  if (space > 0) trimmed = trimmed.slice(0, space) + "-" + trimmed.slice(space + 1).replace(/ /g, "-");
  return trimmed;
}

function isCiTag(tag) {
  return String(tag).toLowerCase() === CI_TAG;
}

function isBetaTag(tag) {
  if (isCiTag(tag)) return false;
  const n = normalizeVersion(tag).toLowerCase();
  return (
    n.includes("beta") ||
    n.includes("-rc") ||
    n.includes("preview") ||
    // bare "pre" but not "release"
    (/\bpre\b/.test(n) && !n.includes("release"))
  );
}

function isStableTag(tag) {
  if (isCiTag(tag)) return false;
  const n = normalizeVersion(tag);
  return !isBetaTag(tag) && !n.toLowerCase().includes("alpha");
}

function detectChannel(tag) {
  if (isCiTag(tag)) return "ci";
  if (isBetaTag(tag)) return "beta";
  if (isStableTag(tag)) return "release";
  return "release";
}

/** Same ranking spirit as LauncherUpdateService.CompareVersions (for sorting history). */
function compareVersionsDesc(left, right) {
  const ln = normalizeVersion(left);
  const rn = normalizeVersion(right);
  const core = v => {
    const i = v.search(/[-+]/);
    return i >= 0 ? v.slice(0, i) : v;
  };
  const pre = v => {
    const i = v.search(/[-+]/);
    return i >= 0 ? v.slice(i + 1).toLowerCase() : "";
  };
  const lc = core(ln);
  const rc = core(rn);
  const parse = s => {
    const p = s.split(".").map(x => parseInt(x, 10) || 0);
    while (p.length < 3) p.push(0);
    return p;
  };
  const a = parse(lc);
  const b = parse(rc);
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return b[i] - a[i];
  }
  const lp = pre(ln);
  const rp = pre(rn);
  const rank = p => {
    if (!p || p === "release") return 3;
    if (p.startsWith("rc")) return 2;
    if (p.includes("beta")) return 1;
    if (p.includes("ci")) return 0;
    return 1;
  };
  const lr = rank(lp);
  const rr = rank(rp);
  if (lr !== rr) return rr - lr;
  return rp.localeCompare(lp, undefined, { numeric: true });
}

function labelFor(tag, channel, title) {
  if (channel === "ci") {
    const sha = title?.match(/[0-9a-f]{7,40}/i)?.[0];
    return sha ? `CI ${sha.slice(0, 7)}` : "CI latest";
  }
  const core = normalizeVersion(tag).replace(/-(release|beta|rc\d*)$/i, "");
  return channel === "beta" ? `${core} Beta` : core;
}

/**
 * Host-only packages since ~1.3.6; older builds used WithPlugin/NoPlugin suffix.
 * Mirrors product history observed on GitHub assets.
 */
function supportsPluginChoice(tag) {
  if (isCiTag(tag)) return false;
  const core = normalizeVersion(tag).split("-")[0];
  const m = core.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return true;
  const major = +m[1];
  const minor = +m[2];
  const patch = +m[3];
  if (major > 1) return false;
  if (major === 1 && minor > 3) return false;
  if (major === 1 && minor === 3 && patch >= 6) return false;
  return true;
}

/** Native installers + portable SKUs from v1.3.20 onward. */
function detectPackaging(tag) {
  if (isCiTag(tag)) return "legacy";
  const core = normalizeVersion(tag).split("-")[0];
  const m = core.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return "legacy";
  const major = +m[1];
  const minor = +m[2];
  const patch = +m[3];
  if (major > 1) return "v2";
  if (major === 1 && minor > 3) return "v2";
  if (major === 1 && minor === 3 && patch >= 20) return "v2";
  return "legacy";
}

function parseAtomFeed(xml) {
  const entries = [];
  const entryRe = /<entry>([\s\S]*?)<\/entry>/gi;
  let em;
  while ((em = entryRe.exec(xml)) !== null) {
    const block = em[1];
    const href =
      block.match(/<link[^>]+href="([^"]+)"/i)?.[1] ||
      [...block.matchAll(/<link[^>]+href="([^"]+)"/gi)].map(x => x[1]).find(Boolean);
    let tag = null;
    if (href) {
      const tm = href.match(/\/releases\/tag\/([^/?#\s"]+)/i);
      if (tm) tag = decodeURIComponent(tm[1]);
    }
    if (!tag) {
      const id = block.match(/<id>([^<]+)<\/id>/i)?.[1];
      if (id) {
        const slash = id.lastIndexOf("/");
        if (slash >= 0) tag = id.slice(slash + 1);
      }
    }
    if (!tag) continue;
    const title = block.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() || tag;
    const updated = block.match(/<updated>([^<]*)<\/updated>/i)?.[1] || undefined;
    entries.push({
      tag,
      title: title
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"'),
      htmlUrl: href || `${GH}/${OWNER}/${REPO}/releases/tag/${encodeURIComponent(tag)}`,
      updated
    });
  }
  return entries;
}

function resolveLatestStableTagFromHeaders(headerText) {
  // Prefer Location (no-follow). Also scan full header blob for /releases/tag/.
  const loc = headerText.match(/^(?:location|Location):\s*(\S+)/m)?.[1];
  const candidates = [loc, ...[...headerText.matchAll(/https:\/\/github\.com\/[^\s]+/g)].map(m => m[0])];
  for (const c of candidates) {
    if (!c) continue;
    const m = c.match(/\/releases\/tag\/([^/?#\s]+)/i);
    if (m) return decodeURIComponent(m[1]);
  }
  return null;
}

async function main() {
  const atomUrl = `${GH}/${OWNER}/${REPO}/releases.atom`;
  console.log("Fetching Atom (same as LauncherUpdateService.FetchReleaseFeedAsync)…");
  const atomXml = await fetchText(atomUrl);
  const feed = parseAtomFeed(atomXml);
  console.log(`Atom entries: ${feed.length}`);

  let stableTag = null;
  try {
    console.log("Resolving /releases/latest (same as ResolveLatestStableTagAsync)…");
    const headers = fetchHeadersWithCurl(`${GH}/${OWNER}/${REPO}/releases/latest`);
    stableTag = resolveLatestStableTagFromHeaders(headers);
    // Some curl builds follow redirects with -I; also try no-follow explicitly.
    if (!stableTag) {
      const headers2 = execFileSync(
        "curl",
        ["-sI", "--max-redirs", "0", "-A", "PCL-N/1.0", `${GH}/${OWNER}/${REPO}/releases/latest`],
        { encoding: "utf8" }
      );
      stableTag = resolveLatestStableTagFromHeaders(headers2);
    }
    console.log(`stable tag from latest redirect: ${stableTag ?? "(none)"}`);
  } catch (e) {
    console.warn("latest redirect:", e.message);
  }

  const byTag = new Map();
  for (const e of feed) {
    if (!byTag.has(e.tag)) byTag.set(e.tag, e);
  }
  if (stableTag && !byTag.has(stableTag)) {
    byTag.set(stableTag, {
      tag: stableTag,
      title: stableTag,
      htmlUrl: `${GH}/${OWNER}/${REPO}/releases/tag/${encodeURIComponent(stableTag)}`
    });
  }
  if (!byTag.has(CI_TAG)) {
    byTag.set(CI_TAG, {
      tag: CI_TAG,
      title: "CI rolling build",
      htmlUrl: `${GH}/${OWNER}/${REPO}/releases/tag/${CI_TAG}`
    });
  }

  const versions = [];
  for (const e of byTag.values()) {
    const channel = detectChannel(e.tag);
    versions.push({
      id: e.tag,
      label: labelFor(e.tag, channel, e.title),
      tag: e.tag,
      channel,
      packaging: detectPackaging(e.tag),
      supportsPluginChoice: supportsPluginChoice(e.tag),
      publishedAt: e.updated,
      // Intentionally empty: LauncherUpdateService builds URLs by convention.
      packageAssets: []
    });
  }

  // Sort: keep feed order preference within channel via CompareVersions desc
  const order = { release: 0, beta: 1, ci: 2 };
  versions.sort((a, b) => {
    if (a.channel !== b.channel) return order[a.channel] - order[b.channel];
    if (a.channel === "ci") return 0;
    return compareVersionsDesc(a.tag, b.tag);
  });

  // Ensure stable from /releases/latest is first in release channel
  if (stableTag) {
    const idx = versions.findIndex(v => v.tag === stableTag);
    if (idx > 0 && versions[idx].channel === "release") {
      const [item] = versions.splice(idx, 1);
      const insertAt = versions.findIndex(v => v.channel === "release");
      versions.splice(insertAt < 0 ? 0 : insertAt, 0, item);
    }
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    source: "github-atom+latest-redirect+convention-urls",
    owner: OWNER,
    repo: REPO,
    stableTagFromLatest: stableTag,
    versions
  };

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(payload, null, 2) + "\n", "utf8");

  const beta = versions.find(v => v.channel === "beta");
  const release = versions.find(v => v.channel === "release");
  console.log(`Wrote ${versions.length} versions -> ${outPath}`);
  console.log(`latest beta=${beta?.tag ?? "—"} release=${release?.tag ?? "—"} ci=${CI_TAG}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
