/**
 * Same discovery model as PCL.Application.Updates.LauncherUpdateService:
 *
 * Sources (GitHub web only — no REST API, no third-party / CF HTML proxy):
 *   - Atom:    https://github.com/{owner}/{repo}/releases.atom
 *   - Latest:  https://github.com/{owner}/{repo}/releases/latest (redirect → stable tag)
 *   - Assets:  convention URLs (BuildFullPackage), no asset listing
 *
 * Browser loads the build-time catalog (public/launcher-releases.json) which is produced
 * by scripts/fetch-launcher-releases.mjs using those same sources via curl/Node.
 * Download links are always https://github.com/.../releases/download/...
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

/** Align with production release host used by the updater after redirects. */
export const DEFAULT_OWNER = "PCL-N-Edition";
export const DEFAULT_REPO = "PCL-N";
export const CI_ROLLING_TAG = "ci-latest";

const GH = "https://github.com";

const LOCAL_CATALOG = `${import.meta.env.BASE_URL || "/"}launcher-releases.json`.replace(
  /\/{2,}/g,
  "/"
);

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
    id: "v1.2.7-release",
    label: "1.2.7",
    tag: "v1.2.7-release",
    channel: "release",
    packaging: "legacy",
    supportsPluginChoice: true,
    packageAssets: []
  },
  {
    id: CI_ROLLING_TAG,
    label: "CI latest",
    tag: CI_ROLLING_TAG,
    channel: "ci",
    packaging: "legacy",
    supportsPluginChoice: false,
    packageAssets: []
  }
];

/** LauncherUpdateService.NormalizeVersion */
export function normalizeVersion(value: string): string {
  let trimmed = value.trim();
  if (trimmed.startsWith("v") || trimmed.startsWith("V")) trimmed = trimmed.slice(1);
  const plus = trimmed.indexOf("+");
  if (plus >= 0) trimmed = trimmed.slice(0, plus);
  trimmed = trimmed.replace(/_/g, "-");
  const space = trimmed.indexOf(" ");
  if (space > 0) trimmed = `${trimmed.slice(0, space)}-${trimmed.slice(space + 1).replace(/ /g, "-")}`;
  return trimmed;
}

export function isCiTag(tag: string): boolean {
  return tag.toLowerCase() === CI_ROLLING_TAG;
}

/** LauncherUpdateService.IsBetaTag */
export function isBetaTag(tag: string): boolean {
  if (isCiTag(tag)) return false;
  const n = normalizeVersion(tag).toLowerCase();
  return (
    n.includes("beta") ||
    n.includes("-rc") ||
    n.includes("preview") ||
    (/\bpre\b/.test(n) && !n.includes("release"))
  );
}

/** LauncherUpdateService.IsStableTag */
export function isStableTag(tag: string): boolean {
  if (isCiTag(tag)) return false;
  const n = normalizeVersion(tag);
  return !isBetaTag(tag) && !n.toLowerCase().includes("alpha");
}

export function detectChannel(tag: string): ReleaseChannel {
  if (isCiTag(tag)) return "ci";
  if (isBetaTag(tag)) return "beta";
  return "release";
}

/** Sort newer first (numeric core, then stable > beta). */
export function compareVersionsDesc(left: string, right: string): number {
  const ln = normalizeVersion(left);
  const rn = normalizeVersion(right);
  const core = (v: string) => {
    const i = v.search(/[-+]/);
    return i >= 0 ? v.slice(0, i) : v;
  };
  const pre = (v: string) => {
    const i = v.search(/[-+]/);
    return i >= 0 ? v.slice(i + 1).toLowerCase() : "";
  };
  const parse = (s: string) => {
    const p = s.split(".").map(x => parseInt(x, 10) || 0);
    while (p.length < 3) p.push(0);
    return p;
  };
  const a = parse(core(ln));
  const b = parse(core(rn));
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return b[i] - a[i];
  }
  const rank = (p: string) => {
    if (!p || p === "release") return 3;
    if (p.startsWith("rc")) return 2;
    if (p.includes("beta")) return 1;
    if (p.includes("ci")) return 0;
    return 1;
  };
  const lr = rank(pre(ln));
  const rr = rank(pre(rn));
  if (lr !== rr) return rr - lr;
  return pre(rn).localeCompare(pre(ln), undefined, { numeric: true });
}

/** @deprecated use compareVersionsDesc */
export function compareTagsDesc(a: string, b: string): number {
  return compareVersionsDesc(a, b);
}

/**
 * LauncherUpdateService.BuildFullPackage asset naming:
 *   PCL_N_{Release|Beta|CI}_{runtimeId}_{SelfContained|NoRuntime}[_{WithPlugin|NoPlugin}].{zip|tar.gz}
 */
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
  // CI always SelfContained (CheckCiAsync / BuildFullPackage).
  const variant =
    input.channel === "ci" || input.includeRuntime ? "SelfContained" : "NoRuntime";
  const plugin = input.supportsPluginChoice
    ? `_${input.includePlugin ? "WithPlugin" : "NoPlugin"}`
    : "";
  const base = `PCL_N_${configuration}_${input.runtimeId}_${variant}${plugin}`;

  // v2 installers (experimental) — same stem when packaging says so.
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

  const ext = input.runtimeId.startsWith("win-") ? "zip" : "tar.gz";
  return `${base}.${ext}`;
}

/** LauncherUpdateService.BuildReleaseAssetUrl */
export function buildReleaseAssetUrl(
  tag: string,
  assetName: string,
  owner = DEFAULT_OWNER,
  repo = DEFAULT_REPO
): string {
  return `${GH}/${owner}/${repo}/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(assetName)}`;
}

export function resolveDownloadUrls(
  version: ReleaseVersion,
  assetFileName: string
): { downloadUrl: string; signatureUrl: string; assetName: string } {
  // Prefer catalog hit if present (optional).
  const exact = version.packageAssets?.find(a => a.name === assetFileName);
  if (exact) {
    return {
      downloadUrl: exact.browser_download_url,
      signatureUrl: `${exact.browser_download_url}.asc`,
      assetName: exact.name
    };
  }

  // Convention URLs — same as the desktop updater (no asset listing).
  const downloadUrl = buildReleaseAssetUrl(version.tag, assetFileName);
  return {
    downloadUrl,
    signatureUrl: `${downloadUrl}.asc`,
    assetName: assetFileName
  };
}

function normalizeVersionRow(raw: Partial<ReleaseVersion> & { tag?: string; id?: string }): ReleaseVersion | null {
  const tag = (raw.tag || raw.id || "").trim();
  if (!tag) return null;
  const channel = (raw.channel as ReleaseChannel | undefined) ?? detectChannel(tag);
  return {
    id: raw.id || tag,
    label: raw.label || tag,
    tag,
    channel,
    packaging: raw.packaging === "v2" ? "v2" : "legacy",
    supportsPluginChoice: Boolean(raw.supportsPluginChoice),
    publishedAt: raw.publishedAt,
    packageAssets: Array.isArray(raw.packageAssets) ? raw.packageAssets : []
  };
}

function sortVersions(versions: ReleaseVersion[]): ReleaseVersion[] {
  const order: Record<ReleaseChannel, number> = { release: 0, beta: 1, ci: 2 };
  return [...versions].sort((a, b) => {
    if (a.channel !== b.channel) return order[a.channel] - order[b.channel];
    if (a.channel === "ci") return 0;
    return compareVersionsDesc(a.tag, b.tag);
  });
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
      .map(item => normalizeVersionRow(item as Partial<ReleaseVersion>))
      .filter((v): v is ReleaseVersion => v !== null);
    return versions.length ? sortVersions(versions) : null;
  } catch {
    return null;
  }
}

/**
 * Browser: same-origin catalog only (scraped at build with updater-equivalent sources).
 * Does not call api.github.com or any non-GitHub proxy.
 */
export async function fetchLauncherVersions(signal?: AbortSignal): Promise<ReleaseVersion[]> {
  const local = await loadJsonCatalog(LOCAL_CATALOG, signal);
  if (local?.length) return local;
  return sortVersions(FALLBACK_VERSIONS);
}

export function versionsForChannel(
  all: ReleaseVersion[],
  channel: ReleaseChannel
): ReleaseVersion[] {
  return all.filter(v => v.channel === channel).sort((a, b) => {
    if (channel === "ci") return 0;
    return compareVersionsDesc(a.tag, b.tag);
  });
}

export function latestForChannel(
  all: ReleaseVersion[],
  channel: ReleaseChannel
): ReleaseVersion | undefined {
  // Mirror ResolveStableRelease / ResolveBetaRelease: first after sort = newest.
  return versionsForChannel(all, channel)[0];
}
