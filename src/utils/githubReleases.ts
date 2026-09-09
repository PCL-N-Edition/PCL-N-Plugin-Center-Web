export interface GithubRelease {
  tag_name: string; name: string; body: string; published_at: string; html_url: string; draft?: boolean;
  assets: { name: string; browser_download_url: string; size: number }[];
}
const api = "https://api.github.com/repos/PCL-N-Edition/PCL-N/releases?per_page=100";
let cached: GithubRelease[] | undefined;
let checkedAt = 0;
let pending: Promise<GithubRelease[]> | undefined;
export async function loadGithubReleases(signal?: AbortSignal): Promise<GithubRelease[]> {
  signal?.throwIfAborted();
  if (cached && Date.now() - checkedAt < 60000) return cached;
  pending ??= (async () => {
    const response = await fetch(api, { headers: { Accept: "application/vnd.github+json" }, cache: "no-cache", signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(`GitHub HTTP ${response.status}`);
    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) throw new Error("Invalid GitHub release catalog");
    const releases = payload.filter((r): r is GithubRelease => r && typeof r.tag_name === "string"
      && !r.draft && typeof r.published_at === "string" && Array.isArray(r.assets)
      && r.html_url === `https://github.com/PCL-N-Edition/PCL-N/releases/tag/${r.tag_name}`);
    cached = releases.map(r => ({ ...r, name: r.name || r.tag_name, body: r.body || "", assets: r.assets.filter(a => a && typeof a.name === "string" && typeof a.browser_download_url === "string" && Number.isFinite(a.size)) }));
    checkedAt = Date.now(); return cached;
  })().finally(() => { pending = undefined; });
  const result = await pending;
  signal?.throwIfAborted();
  return result;
}
/** A visible page revalidates every minute and immediately after returning online/in focus. */
export function watchReleaseUpdates(refresh: () => void): () => void {
  const update = () => { if (document.visibilityState === "visible") refresh(); };
  const timer = window.setInterval(update, 60000);
  document.addEventListener("visibilitychange", update);
  window.addEventListener("online", update);
  window.addEventListener("focus", update);
  return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", update); window.removeEventListener("online", update); window.removeEventListener("focus", update); };
}
