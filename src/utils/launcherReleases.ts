/**
 * Launcher release discovery from GitHub *web pages* (HTML / Atom), not the REST API.
 * Pages have no REST rate limit; listing uses releases HTML + atom, assets use expanded_assets HTML.
 */

export type ReleaseChannel = "release" | "beta" | "ci";
export type Packaging = "legacy" | "v2";

export interface ReleaseAsset {
  name: string;
  browser_download_url: string;
}

export interface ReleaseVersion {
  id: string;
  label: string;
  tag: string;
  channel: ReleaseChannel;
  packaging: Packaging;
  supportsPluginChoice: boolean;
  publishedAt?: string;
  packageAssets: ReleaseAsset[];
}

const REPO = "PCL-N-Edition/PCL-N";
const GH = "https://github.com";

const PACKAGE_ASSET = /^PCL_N_(Release|Beta|CI)_/i;
const SKIP_ASSET = /\.(asc|sha256|hdiff|json)$/i;

/** Optional same-origin proxy prefix, e.g. "/github-html" → /github-html/PCL-N-Edition/... */
const HTML_PROXY = (import.meta.env.VITE_GITHUB_HTML_PROXY as string | undefined)?.replace(/\/$/, "") ?? "";

export const FALLBACK_VERSIONS: ReleaseVersion[] = [
  {
    id: "v1.3.19-beta",
    label: "1.3.19 Beta",
    tag: "v1.3.19-beta",
    channel: "beta",
    packaging: "legacy",
    supportsPluginChoice: false,
    packageAssets: []
  },
  {
    id: "v1.3.18-beta",
    label: "1.3.18 Beta",
    tag: "v1.3.18-beta",
    channel: "beta",
    packaging: "legacy",
    supportsPluginChoice: false,
    packageAssets: []
  },
  {
    id: "v1.3.17-beta",
    label: "1.3.17 Beta",
    tag: "v1.3.17-beta",
    channel: "beta",
    packaging: "legacy",
    supportsPluginChoice: false,
    packageAssets: []
  },
  {
    id: "v1.2.7-release",
    label: "1.2.7",
    tag: "v1.2.7-release",
    channel: "release",
    packaging: "legacy",
    supportsPluginChoice: true,
    packageAssets: []
  },
  {
    id: "ci-latest",
    label: "CI latest",
    tag: "ci-latest",
    channel: "ci",
    packaging: "legacy",
    supportsPluginChoice: false,
    packageAssets: []
  }
];

export function detectChannel(tag: string): ReleaseChannel | null {
  const t = tag.trim();
  if (!t) return null;
  if (/^ci(-|$)/i.test(t) || t.toLowerCase() === "ci-latest") return "ci";
  if (/-release$/i.test(t)) return "release";
  if (/-beta$/i.test(t) || /-rc\d*$/i.test(t)) return "beta";
  // Untagged prerelease-style names still map to beta when they contain "beta".
  if (/beta/i.test(t)) return "beta";
  return "release";
}

function isPackageAsset(name: string): boolean {
  if (SKIP_ASSET.test(name)) return false;
  return PACKAGE_ASSET.test(name) || /Portable|Installer/i.test(name);
}

function packagingOf(assets: ReleaseAsset[]): Packaging {
  if (assets.some(a => /_Installer\.|_Portable\./i.test(a.name))) return "v2";
  return "legacy";
}

function supportsPluginChoice(assets: ReleaseAsset[]): boolean {
  return assets.some(a => /_(WithPlugin|NoPlugin)(\.|_)/i.test(a.name));
}

function labelFor(tag: string, channel: ReleaseChannel, title?: string): string {
  if (channel === "ci") {
    const fromTitle = title?.match(/[0-9a-f]{7,40}/i)?.[0];
    return fromTitle ? `CI ${fromTitle.slice(0, 7)}` : "CI latest";
  }
  const core = tag.replace(/^v/i, "").replace(/-release$/i, "").replace(/-beta$/i, "");
  if (channel === "beta") return `${core} Beta`;
  return core;
}

export function compareTagsDesc(a: string, b: string): number {
  if (a === b) return 0;
  if (/^ci/i.test(a) && !/^ci/i.test(b)) return -1;
  if (/^ci/i.test(b) && !/^ci/i.test(a)) return 1;

  const parse = (tag: string) => {
    const m = tag.match(/^v?(\d+)\.(\d+)\.(\d+)(?:[-.](.+))?$/i);
    if (!m) return { major: 0, minor: 0, patch: 0, pre: tag };
    return {
      major: Number(m[1]),
      minor: Number(m[2]),
      patch: Number(m[3]),
      pre: m[4] ?? ""
    };
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

/** Resolve a fetch URL for a GitHub web path (not api.github.com). */
function githubWebUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (HTML_PROXY) return `${HTML_PROXY}${normalized}`;
  return `${GH}${normalized}`;
}

/**
 * Fetch GitHub HTML/Atom without the REST API.
 * 1) Direct (or same-origin HTML proxy)
 * 2) Fallback: r.jina.ai text mirror of the same page (no REST quota; browser CORS OK)
 */
async function fetchGithubWebText(path: string, signal?: AbortSignal): Promise<string> {
  const primary = githubWebUrl(path);
  try {
    const response = await fetch(primary, {
      cache: "no-cache",
      signal,
      headers: { Accept: "text/html,application/xhtml+xml,application/atom+xml,text/plain,*/*" }
    });
    if (response.ok) {
      const text = await response.text();
      if (text && text.length > 80) return text;
    }
  } catch {
    // CORS or network — try reader mirror
  }

  // Unlimited-ish webpage reader mirror (not GitHub REST).
  const absolute = `${GH}${path.startsWith("/") ? path : `/${path}`}`;
  const mirror = `https://r.jina.ai/http://github.com${path.startsWith("/") ? path : `/${path}`}`;
  const response = await fetch(mirror, {
    cache: "no-cache",
    signal,
    headers: { Accept: "text/plain" }
  });
  if (!response.ok) throw new Error(`GitHub web fetch failed for ${absolute} (${response.status})`);
  return await response.text();
}

/** Parse tags from releases HTML and/or Atom feed text. */
export function parseReleaseTagsFromWeb(text: string): Array<{ tag: string; title: string }> {
  const found = new Map<string, string>();

  // HTML: /PCL-N-Edition/PCL-N/releases/tag/v1.3.19-beta
  const htmlRe = /\/PCL-N-Edition\/PCL-N\/releases\/tag\/([^"'?\s#]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = htmlRe.exec(text)) !== null) {
    const tag = decodeURIComponent(m[1]);
    if (!found.has(tag)) found.set(tag, tag);
  }

  // Atom: <link ... href=".../releases/tag/v1.3.19-beta"/> + <title>
  const atomEntryRe =
    /<entry>[\s\S]*?<link[^>]+href="[^"]*\/releases\/tag\/([^"]+)"[\s\S]*?<title>([^<]*)<\/title>[\s\S]*?<\/entry>/gi;
  while ((m = atomEntryRe.exec(text)) !== null) {
    const tag = decodeURIComponent(m[1]);
    const title = decodeHtmlEntities(m[2].trim());
    found.set(tag, title || tag);
  }

  // jina markdown style: [PCL N v1.3.19 Beta](https://github.com/.../releases/tag/v1.3.19-beta)
  const mdRe =
    /\[([^\]]+)\]\(https?:\/\/github\.com\/PCL-N-Edition\/PCL-N\/releases\/tag\/([^)\s]+)\)/gi;
  while ((m = mdRe.exec(text)) !== null) {
    const title = m[1].trim();
    const tag = decodeURIComponent(m[2]);
    found.set(tag, title || tag);
  }

  return [...found.entries()].map(([tag, title]) => ({ tag, title }));
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/** Parse package asset links from expanded_assets HTML (or jina text of that page). */
export function parseAssetsFromExpandedHtml(tag: string, html: string): ReleaseAsset[] {
  const assets: ReleaseAsset[] = [];
  const seen = new Set<string>();

  // href="/PCL-N-Edition/PCL-N/releases/download/v1.3.19-beta/PCL_N_Beta_win-x64_SelfContained.zip"
  const re =
    /\/PCL-N-Edition\/PCL-N\/releases\/download\/([^/"'\s]+)\/([^"'?\s#]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const assetTag = decodeURIComponent(m[1]);
    if (assetTag !== tag && assetTag !== encodeURIComponent(tag)) {
      // still accept if page is for this tag
    }
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

async function loadTags(signal?: AbortSignal): Promise<Array<{ tag: string; title: string }>> {
  const merged = new Map<string, string>();

  // Atom first (compact, no REST quota).
  try {
    const atom = await fetchGithubWebText(`/${REPO}/releases.atom`, signal);
    for (const item of parseReleaseTagsFromWeb(atom)) merged.set(item.tag, item.title);
  } catch {
    // continue
  }

  // HTML pages for deeper history (GitHub paginates ~10 per page).
  for (const page of [1, 2, 3, 4]) {
    try {
      const path = page === 1 ? `/${REPO}/releases` : `/${REPO}/releases?page=${page}`;
      const html = await fetchGithubWebText(path, signal);
      const batch = parseReleaseTagsFromWeb(html);
      if (!batch.length) break;
      for (const item of batch) {
        if (!merged.has(item.tag)) merged.set(item.tag, item.title);
      }
      // Stop early if page returned few tags (end of list).
      if (batch.length < 5) break;
    } catch {
      break;
    }
  }

  // Always include rolling CI tag.
  if (!merged.has("ci-latest")) merged.set("ci-latest", "CI latest");

  return [...merged.entries()].map(([tag, title]) => ({ tag, title }));
}

async function loadAssetsForTag(tag: string, signal?: AbortSignal): Promise<ReleaseAsset[]> {
  try {
    const html = await fetchGithubWebText(
      `/${REPO}/releases/expanded_assets/${encodeURIComponent(tag)}`,
      signal
    );
    return parseAssetsFromExpandedHtml(tag, html);
  } catch {
    return [];
  }
}

export async function fetchLauncherVersions(signal?: AbortSignal): Promise<ReleaseVersion[]> {
  const tags = await loadTags(signal);
  if (!tags.length) throw new Error("No release tags found on GitHub web pages.");

  // Load assets for recent tags in parallel batches (web HTML, not API).
  const ordered = [...tags].sort((a, b) => compareTagsDesc(a.tag, b.tag));
  // Cap asset probes to keep first paint fast; history still listed with empty assets when needed.
  const probeLimit = 36;
  const toProbe = ordered.slice(0, probeLimit);

  const versions: ReleaseVersion[] = [];
  const concurrency = 6;
  for (let i = 0; i < toProbe.length; i += concurrency) {
    const chunk = toProbe.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map(async item => {
        const channel = detectChannel(item.tag);
        if (!channel) return null;
        const packageAssets = await loadAssetsForTag(item.tag, signal);
        // Skip empty stubs (e.g. tag-only beta with no packages), keep CI.
        if (packageAssets.length === 0 && channel !== "ci") return null;
        return {
          id: item.tag,
          label: labelFor(item.tag, channel, item.title),
          tag: item.tag,
          channel,
          packaging: packagingOf(packageAssets),
          supportsPluginChoice: supportsPluginChoice(packageAssets),
          packageAssets
        } satisfies ReleaseVersion;
      })
    );
    for (const v of chunkResults) if (v) versions.push(v);
  }

  // Older tags beyond probe window: still list if we only need history labels for dropdown
  // of channels already covered — optional. Prefer only downloadable versions.
  if (!versions.some(v => v.channel === "ci")) {
    versions.push(FALLBACK_VERSIONS.find(v => v.channel === "ci")!);
  }

  versions.sort((a, b) => {
    const order: Record<ReleaseChannel, number> = { release: 0, beta: 1, ci: 2 };
    if (a.channel !== b.channel) return order[a.channel] - order[b.channel];
    return compareTagsDesc(a.tag, b.tag);
  });

  if (!versions.length) throw new Error("No downloadable releases parsed from GitHub pages.");
  return versions;
}

export function versionsForChannel(
  all: ReleaseVersion[],
  channel: ReleaseChannel
): ReleaseVersion[] {
  return all.filter(v => v.channel === channel).sort((a, b) => compareTagsDesc(a.tag, b.tag));
}

export function latestForChannel(
  all: ReleaseVersion[],
  channel: ReleaseChannel
): ReleaseVersion | undefined {
  return versionsForChannel(all, channel)[0];
}

export function buildAssetFileName(input: {
  channel: ReleaseChannel;
  runtimeId: string;
  includeRuntime: boolean;
  includePlugin: boolean;
  supportsPluginChoice: boolean;
  packaging: Packaging;
  platform: "windows" | "macos" | "linux";
  delivery: "installer" | "portable";
  packageFormat: string;
}): string {
  const configuration =
    input.channel === "release" ? "Release" : input.channel === "ci" ? "CI" : "Beta";
  // CI channel currently only ships SelfContained.
  const runtime =
    input.channel === "ci" || input.includeRuntime ? "SelfContained" : "NoRuntime";
  const plugin = input.supportsPluginChoice
    ? `_${input.includePlugin ? "WithPlugin" : "NoPlugin"}`
    : "";
  const base = `PCL_N_${configuration}_${input.runtimeId}_${runtime}${plugin}`;

  if (input.packaging === "v2") {
    if (input.delivery === "portable")
      return `${base}_Portable.${input.platform === "windows" ? "exe" : "tar.gz"}`;
    const suffix =
      input.packageFormat === "exe-installer"
        ? "exe"
        : input.packageFormat === "appimage"
          ? "AppImage"
          : input.packageFormat;
    return `${base}_Installer.${suffix}`;
  }

  return `${base}.${input.platform === "windows" ? "zip" : "tar.gz"}`;
}

export function resolveDownloadUrls(
  version: ReleaseVersion,
  assetFileName: string
): { downloadUrl: string; signatureUrl: string; assetName: string } {
  const exact = version.packageAssets.find(a => a.name === assetFileName);
  if (exact) {
    return {
      downloadUrl: exact.browser_download_url,
      signatureUrl: `${exact.browser_download_url}.asc`,
      assetName: exact.name
    };
  }

  const normalize = (name: string) => name.toLowerCase().replace(/_(withplugin|noplugin)/g, "");
  const fuzzy = version.packageAssets.find(a => normalize(a.name) === normalize(assetFileName));
  if (fuzzy) {
    return {
      downloadUrl: fuzzy.browser_download_url,
      signatureUrl: `${fuzzy.browser_download_url}.asc`,
      assetName: fuzzy.name
    };
  }

  // CI: force SelfContained name if user picked NoRuntime.
  if (version.channel === "ci") {
    const ciName = assetFileName.replace("_NoRuntime", "_SelfContained");
    const ciHit = version.packageAssets.find(a => a.name === ciName);
    if (ciHit) {
      return {
        downloadUrl: ciHit.browser_download_url,
        signatureUrl: `${ciHit.browser_download_url}.asc`,
        assetName: ciHit.name
      };
    }
  }

  const tag = encodeURIComponent(version.tag);
  const file = encodeURIComponent(assetFileName);
  const downloadUrl = `${GH}/${REPO}/releases/download/${tag}/${file}`;
  return { downloadUrl, signatureUrl: `${downloadUrl}.asc`, assetName: assetFileName };
}
