/**
 * Launcher release discovery — GitHub only (no REST API, no third-party / CF proxy).
 *
 * Runtime (browser):
 *   1) same-origin /launcher-releases.json  (written at site build from GitHub HTML)
 *   2) raw.githubusercontent.com catalog branch (optional, still GitHub)
 *   3) built-in FALLBACK_VERSIONS
 *
 * Build time (Node, no CORS):
 *   scripts/fetch-launcher-releases.mjs scrapes github.com HTML/Atom/expanded_assets.
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

/** Same-origin catalog produced by scripts/fetch-launcher-releases.mjs */
const LOCAL_CATALOG = `${import.meta.env.BASE_URL || "/"}launcher-releases.json`.replace(
  /\/{2,}/g,
  "/"
);

/** Optional GitHub raw catalog (CORS-friendly, not REST API). */
const RAW_CATALOG =
  "https://raw.githubusercontent.com/PCL-N-Edition/PCL-N/download-catalog/downloads.json";

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
  if (/-beta$/i.test(t) || /-rc\d*$/i.test(t) || /beta/i.test(t)) return "beta";
  return "release";
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

function normalizeVersion(raw: Partial<ReleaseVersion> & { tag?: string; id?: string }): ReleaseVersion | null {
  const tag = (raw.tag || raw.id || "").trim();
  if (!tag) return null;
  const channel = (raw.channel as ReleaseChannel | undefined) ?? detectChannel(tag);
  if (!channel) return null;
  const packageAssets = Array.isArray(raw.packageAssets) ? raw.packageAssets : [];
  return {
    id: raw.id || tag,
    label: raw.label || tag,
    tag,
    channel,
    packaging: raw.packaging === "v2" ? "v2" : "legacy",
    supportsPluginChoice: Boolean(raw.supportsPluginChoice),
    publishedAt: raw.publishedAt,
    packageAssets: packageAssets
      .filter(a => a && typeof a.name === "string" && typeof a.browser_download_url === "string")
      .map(a => ({
        name: a.name,
        browser_download_url: a.browser_download_url.startsWith("https://github.com/")
          ? a.browser_download_url
          : `${GH}/${REPO}/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(a.name)}`
      }))
  };
}

async function loadJsonCatalog(url: string, signal?: AbortSignal): Promise<ReleaseVersion[] | null> {
  try {
    const response = await fetch(url, {
      cache: "no-cache",
      signal,
      headers: { Accept: "application/json,text/plain,*/*" }
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { versions?: unknown[] } | unknown[];
    const list = Array.isArray(payload) ? payload : payload.versions;
    if (!Array.isArray(list) || !list.length) return null;
    const versions = list
      .map(item => normalizeVersion(item as Partial<ReleaseVersion>))
      .filter((v): v is ReleaseVersion => v !== null);
    return versions.length ? sortVersions(versions) : null;
  } catch {
    return null;
  }
}

function sortVersions(versions: ReleaseVersion[]): ReleaseVersion[] {
  const order: Record<ReleaseChannel, number> = { release: 0, beta: 1, ci: 2 };
  return [...versions].sort((a, b) => {
    if (a.channel !== b.channel) return order[a.channel] - order[b.channel];
    return compareTagsDesc(a.tag, b.tag);
  });
}

/**
 * Browser-safe loaders only talk to:
 * - the site itself (launcher-releases.json from build)
 * - raw.githubusercontent.com (GitHub raw, not REST API)
 * Download buttons always use https://github.com/.../releases/download/...
 */
export async function fetchLauncherVersions(signal?: AbortSignal): Promise<ReleaseVersion[]> {
  const local = await loadJsonCatalog(LOCAL_CATALOG, signal);
  if (local?.length) return local;

  const raw = await loadJsonCatalog(RAW_CATALOG, signal);
  if (raw?.length) return raw;

  // No third-party mirrors / CF HTML proxies — fall back to baked-in list.
  return sortVersions(FALLBACK_VERSIONS);
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
