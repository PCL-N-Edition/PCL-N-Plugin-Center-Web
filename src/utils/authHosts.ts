import { supabase } from "@/lib/supabase";
import {
  NCLOUD_LEGAL_VERSION,
  acceptNCloudLegal,
  hasAcceptedNCloudLegal
} from "@/utils/legal";

/** Public storefront (market / download / dashboard). */
export const PRIMARY_STORE_ORIGIN = "https://pcln.top";

/** Dedicated host for login, OAuth callback, and legal acceptance. */
export const AUTH_ORIGIN = "https://auth.pcln.top";

export const isAuthHost = (): boolean =>
  typeof window !== "undefined" && window.location.hostname.toLowerCase() === "auth.pcln.top";

export const isPrimaryStoreHost = (): boolean =>
  typeof window !== "undefined" &&
  ["pcln.top", "www.pcln.top"].includes(window.location.hostname.toLowerCase());

/** Local / CF Pages preview hosts keep login same-origin (no dual-host hop). */
export const isLocalAuthHost = (): boolean => {
  if (typeof window === "undefined") return true;
  const host = window.location.hostname.toLowerCase();
  // *.pages.dev = Cloudflare Pages preview deployments
  return host === "localhost" || host === "127.0.0.1" || host.endsWith(".pages.dev");
};

/** Paths that may stay on auth.pcln.top without bouncing to the store. */
export const isAuthOnlyPath = (path: string): boolean => {
  const normalized = (path.replace(/\/+$/, "") || "/").toLowerCase();
  return (
    normalized === "/login" ||
    normalized === "/legal/accept" ||
    normalized === "/auth/callback"
  );
};

/**
 * Build absolute history-mode URLs (never hash).
 * Trailing slash is kept for static hosts that resolve directory/index.html;
 * Cloudflare Pages SPA fallback (_redirects) also works without it.
 */
export const buildExternalRoute = (origin: string, route: string): URL => {
  const base = new URL(import.meta.env.BASE_URL || "/", origin);
  const normalizedRoute = route.startsWith("/") ? route : `/${route}`;
  const routeUrl = new URL(normalizedRoute, base.origin);
  const basePath = base.pathname.replace(/\/$/, "") || "";
  const appPath = routeUrl.pathname.startsWith("/") ? routeUrl.pathname : `/${routeUrl.pathname}`;
  let pathname = `${basePath}${appPath}`.replace(/\/{2,}/g, "/") || "/";
  if (!pathname.endsWith("/") && !pathname.split("/").pop()?.includes(".")) {
    pathname = `${pathname}/`;
  }
  base.pathname = pathname;
  base.search = routeUrl.search;
  base.hash = "";
  return base;
};

export const replaceExternalRoute = (origin: string, route: string): void => {
  window.location.replace(buildExternalRoute(origin, route).toString());
};

/** Always send login to auth.pcln.top (local dev stays in-app). */
export const replaceWithAuthLogin = (redirect: string): void => {
  if (isLocalAuthHost()) {
    const target = buildExternalRoute(
      window.location.origin,
      `/login?redirect=${encodeURIComponent(redirect)}`
    );
    window.location.replace(target.toString());
    return;
  }
  const target = buildExternalRoute(
    AUTH_ORIGIN,
    `/login?redirect=${encodeURIComponent(redirect)}`
  );
  window.location.replace(target.toString());
};

/**
 * PKCE sessions live in origin-scoped storage. After OAuth on auth.pcln.top,
 * hand tokens to pcln.top via URL fragment (not sent to servers) then setSession there.
 */
export const handoffSessionToStore = async (redirectPath: string): Promise<void> => {
  const safeRedirect =
    redirectPath.startsWith("/") && !redirectPath.startsWith("//") ? redirectPath : "/market";

  if (isLocalAuthHost()) {
    window.location.replace(safeRedirect);
    return;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    replaceExternalRoute(PRIMARY_STORE_ORIGIN, safeRedirect);
    return;
  }

  const target = buildExternalRoute(
    PRIMARY_STORE_ORIGIN,
    `/auth/callback?redirect=${encodeURIComponent(safeRedirect)}`
  );
  const params = new URLSearchParams({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token
  });
  if (hasAcceptedNCloudLegal()) {
    params.set("legal", NCLOUD_LEGAL_VERSION);
  }
  target.hash = params.toString();
  window.location.replace(target.toString());
};

/** True when the current location is the session handoff landing route. */
export const isAuthCallbackPath = (pathname = window.location.pathname): boolean => {
  const normalized = (pathname.replace(/\/+$/, "") || "/").toLowerCase();
  return normalized === "/auth/callback" || normalized.endsWith("/auth/callback");
};

/** Consume hash handoff on the store host; returns the intended app redirect. */
export const consumeStoreAuthHandoff = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;

  const rawHash = window.location.hash.replace(/^#/, "");
  // Accept tokens either on /auth/callback or (legacy) as a bare hash handoff.
  const hasTokens = rawHash.includes("access_token=") && rawHash.includes("refresh_token=");
  if (!hasTokens) return null;
  if (!isAuthCallbackPath() && !rawHash.startsWith("access_token=")) {
    return null;
  }

  const params = new URLSearchParams(rawHash);
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  if (!access_token || !refresh_token) {
    return null;
  }

  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) {
    console.warn("auth handoff setSession failed", error);
    return null;
  }

  const legal = params.get("legal");
  if (legal === NCLOUD_LEGAL_VERSION) {
    acceptNCloudLegal();
  }

  const current = new URL(window.location.href);
  const redirectParam = current.searchParams.get("redirect");
  const redirect =
    redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")
      ? redirectParam
      : "/market";

  // Strip tokens immediately but keep the callback path until the router navigates.
  // Replacing straight to `redirect` can race history-mode matching and surface a 404 shell.
  current.hash = "";
  current.searchParams.delete("redirect");
  window.history.replaceState(
    window.history.state,
    document.title,
    `${current.pathname}${current.search}`
  );
  return redirect;
};

/**
 * OAuth redirectTo must stay on the same origin that started PKCE.
 * Production: always auth.pcln.top/login so code exchange runs there.
 */
export const buildOAuthRedirectTo = (appRedirect: string): string => {
  const safeRedirect = appRedirect.startsWith("/") ? appRedirect : `/${appRedirect}`;
  const origin = isLocalAuthHost() ? window.location.origin : AUTH_ORIGIN;
  return buildExternalRoute(
    origin,
    `/login?redirect=${encodeURIComponent(safeRedirect)}`
  ).toString();
};
