import { supabase } from "@/lib/supabase";

export interface CreateOrganizationInput {
  slug: string;
  displayName: string;
}

export interface CreateNamespaceInput {
  namespace: string;
}

export interface PluginTranslationInput {
  displayName: string;
  summary: string;
  description: string;
}

export interface CreatePluginInput {
  organizationId: string;
  namespaceId: string;
  pluginId: string;
  translations: Record<"zh-CN" | "en-US", PluginTranslationInput>;
  repositoryUrl?: string;
  visibility: string;
}

export interface UpdatePluginInput {
  translations: Record<"zh-CN" | "en-US", PluginTranslationInput>;
  repositoryUrl?: string;
  visibility: string;
}

export interface UploadVersionInput {
  pluginId: string;
  version: string;
  channel: string;
  releaseNotes: string;
  minimumLauncherVersion: string;
  package: File;
}

export interface MarketPlugin {
  pluginId: string;
  name: string;
  summary?: string;
  description?: string;
  latestVersion?: string;
  publisherId?: string;
  publisherName?: string;
  category: string;
  categories: string[];
  tags: string[];
  pricingModel: "free" | "one_time";
  priceCents: number;
  currency: "CNY";
  requiresPurchase: boolean;
  permissions?: string[];
  source?: string;
  iconUrl?: string;
  culture?: "zh-CN" | "en-US";
}

export interface MarketCategory { id: string; name: string; description?: string; }
export interface MarketMetadataInput { categoryId: string; tags: string[]; pricingModel: string; priceCents: number; }

export interface AuthorizedDevice {
  id: string;
  device_name: string;
  created_at: string;
  last_seen_at: string;
  expires_at: string;
  revoked_at: string | null;
}

export class PluginCenterApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

const apiBase = () => String(import.meta.env.VITE_WEB_BASE_API || "https://api.pcln.top").replace(/\/+$/, "");

const unwrapItems = <T>(body: unknown): T[] => {
  if (Array.isArray(body)) return body as T[];
  if (body && typeof body === "object" && Array.isArray((body as { items?: unknown }).items))
    return (body as { items: T[] }).items;
  return [];
};

const mapCategory = (row: Record<string, unknown>): MarketCategory => ({
  id: String(row.id ?? row.slug ?? ""),
  name: String(row.name ?? row.displayName ?? row.display_name ?? row.id ?? ""),
  description: row.description == null ? undefined : String(row.description)
});

const mapMarketPlugin = (row: Record<string, unknown>): MarketPlugin => {
  const pricingModel = String(row.pricingModel ?? row.pricing_model ?? "free") === "one_time"
    ? "one_time"
    : "free";
  const priceCents = Number(row.priceCents ?? row.price_cents ?? 0) || 0;
  const categories = Array.isArray(row.categories)
    ? row.categories.map(String)
    : row.category
      ? [String(row.category)]
      : [];
  const tags = Array.isArray(row.tags) ? row.tags.map(String) : [];
  const iconUrl = row.iconUrl == null && row.icon_url == null
    ? undefined
    : String(row.iconUrl ?? row.icon_url);
  return {
    pluginId: String(row.pluginId ?? row.plugin_id ?? row.logical_plugin_id ?? row.slug ?? row.id ?? ""),
    name: String(row.name ?? row.displayName ?? row.display_name ?? row.pluginId ?? row.slug ?? "Plugin"),
    summary: row.summary == null ? undefined : String(row.summary),
    description: row.description == null ? undefined : String(row.description),
    latestVersion: row.latestVersion == null && row.latest_version == null
      ? undefined
      : String(row.latestVersion ?? row.latest_version),
    publisherId: row.publisherId == null && row.publisher_id == null && row.publisherSlug == null
      ? undefined
      : String(row.publisherId ?? row.publisher_id ?? row.publisherSlug),
    publisherName: row.publisherName == null && row.publisher_name == null && row.publisherDisplayName == null
      ? undefined
      : String(row.publisherName ?? row.publisher_name ?? row.publisherDisplayName),
    category: String(row.category ?? categories[0] ?? "utility"),
    categories: categories.length ? categories : ["utility"],
    tags,
    pricingModel,
    priceCents,
    currency: "CNY",
    requiresPurchase: Boolean(row.requiresPurchase ?? pricingModel === "one_time"),
    permissions: Array.isArray(row.permissions) ? row.permissions.map(String) : undefined,
    source: row.source == null ? undefined : String(row.source),
    iconUrl,
    culture: row.culture === "en-US" || row.culture === "zh-CN" ? row.culture : undefined
  };
};

async function authHeaders(authenticated: boolean, extra?: HeadersInit): Promise<Headers> {
  const headers = new Headers(extra);
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (publishableKey) headers.set("apikey", publishableKey);
  if (authenticated) {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    const accessToken = data.session?.access_token;
    if (!accessToken) throw new PluginCenterApiError("请先登录", 401);
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return headers;
}

const request = async <T>(path: string, init: RequestInit = {}, authenticated = true): Promise<T> => {
  const headers = await authHeaders(authenticated, init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");

  const response = await fetch(`${apiBase()}/v1${path}`, {
    ...init,
    headers
  });
  const contentType = response.headers.get("content-type") ?? "";
  const rawText = await response.text();
  let body: any = null;
  if (rawText) {
    try {
      body = contentType.includes("application/json") || rawText.trimStart().startsWith("{")
        ? JSON.parse(rawText)
        : { detail: rawText };
    } catch {
      body = { detail: rawText.slice(0, 500) };
    }
  }
  if (!response.ok) {
    const code = body?.code ?? body?.error ?? "";
    let message =
      body?.detail ??
      body?.title ??
      body?.message ??
      body?.error_description ??
      (typeof body?.error === "string" ? body.error : null) ??
      `请求失败（HTTP ${response.status}）`;
    if (code === "WORKER_RESOURCE_LIMIT" || String(message).includes("WORKER_RESOURCE_LIMIT")) {
      message =
        "上传失败：API Worker 资源不足（WORKER_RESOURCE_LIMIT）。请刷新后重试分块上传。";
    }
    if (
      String(message).includes("maximum allowed size") ||
      String(message).includes("Payload too large") ||
      code === "413" ||
      response.status === 413
    ) {
      message =
        "对象超过单分块大小限制。请刷新页面后重试：大包会自动拆成多分块经 api.pcln.top 上传。";
    }
    throw new PluginCenterApiError(message, response.status);
  }
  return body as T;
};

async function uploadBytesToWorker(uploadUri: string, blob: Blob, sha256: string): Promise<void> {
  const headers = await authHeaders(true);
  headers.set("Content-Type", "application/octet-stream");
  headers.set("x-content-sha256", sha256);
  const response = await fetch(uploadUri, { method: "PUT", headers, body: blob });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new PluginCenterApiError(text.slice(0, 300) || `上传失败（HTTP ${response.status}）`, response.status);
  }
}

/** Browser SHA-256 of a File/Blob as lowercase hex (for direct Storage upload sessions). */
export async function sha256Hex(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

const jsonBody = (value: unknown) => JSON.stringify(value);

export const pluginCenterApi = {
  listMarketPlugins: async (query: { search?: string; category?: string; locale?: string; skip?: number; take?: number } = {}) => {
    const parameters = new URLSearchParams();
    if (query.search) parameters.set("search", query.search);
    if (query.category) parameters.set("category", query.category);
    if (query.locale) parameters.set("locale", query.locale);
    parameters.set("status", "published");
    parameters.set("skip", String(query.skip ?? 0));
    parameters.set("take", String(query.take ?? 50));
    parameters.set("offset", String(query.skip ?? 0));
    parameters.set("limit", String(query.take ?? 50));
    const body = await request<unknown>(`/plugins?${parameters}`, {}, false);
    let items = unwrapItems<Record<string, unknown>>(body).map(mapMarketPlugin);
    if (query.search?.trim()) {
      const needle = query.search.trim().toLowerCase();
      items = items.filter(plugin =>
        plugin.name.toLowerCase().includes(needle) ||
        plugin.pluginId.toLowerCase().includes(needle) ||
        (plugin.summary ?? "").toLowerCase().includes(needle)
      );
    }
    if (query.category?.trim()) {
      const category = query.category.trim();
      items = items.filter(plugin => plugin.category === category || plugin.categories.includes(category));
    }
    return items;
  },
  getMarketPlugin: async (pluginId: string, locale?: string) => {
    const body = await request<unknown>(
      `/plugins/${encodeURIComponent(pluginId)}${locale ? `?locale=${encodeURIComponent(locale)}` : ""}`,
      {},
      false
    );
    const row = body && typeof body === "object" && "plugin" in (body as object)
      ? (body as { plugin: Record<string, unknown> }).plugin
      : body as Record<string, unknown>;
    return mapMarketPlugin(row ?? {});
  },
  listCategories: async () => {
    const body = await request<unknown>("/categories", {}, false);
    return unwrapItems<Record<string, unknown>>(body).map(mapCategory);
  },
  getEntitlement: (pluginId: string) => request<{ entitled: boolean; source?: string }>(`/plugins/${encodeURIComponent(pluginId)}/entitlement`),
  redeemPurchase: (pluginId: string, orderNumber: string, overpaymentDestination: string) => request<Record<string, unknown>>(
    "/purchases/redeem", { method: "POST", body: jsonBody({ pluginId, orderNumber, overpaymentDestination }) }),
  setMarketMetadata: (pluginId: string, input: MarketMetadataInput) => request<Record<string, unknown>>(
    `/publisher/plugins/${pluginId}/market`, { method: "POST", body: jsonBody(input) }),
  getFinanceSummary: (organizationId: string) => request<Record<string, number>>(`/publisher/organizations/${organizationId}/finance`),
  savePayoutProfile: (organizationId: string, account: string, recipient: string) => request<Record<string, unknown>>(
    `/publisher/organizations/${organizationId}/payout-profile`, { method: "PUT", body: jsonBody({ account, recipient }) }),
  requestWithdrawal: (organizationId: string, amountCents: number) => request<Record<string, unknown>>(
    `/publisher/organizations/${organizationId}/withdrawals`, { method: "POST", body: jsonBody({ amountCents }) }),
  decideWithdrawal: (withdrawalId: string, decision: string, reason: string) => request<Record<string, unknown>>(
    `/admin/withdrawals/${withdrawalId}/decision`, { method: "POST", body: jsonBody({ decision, reason }) }),
  getAccount: () => request<{
    profile: Record<string, unknown> | null;
    preferences: Record<string, unknown> | null;
    providers: string[];
    grants: Record<string, unknown>[];
    pluginData: Record<string, unknown>[];
  }>("/account"),
  listAuthorizedDevices: () => request<AuthorizedDevice[]>("/account/devices"),
  revokeAuthorizedDevice: (deviceId: string) => request<{ revoked: boolean }>(
    `/account/devices/${encodeURIComponent(deviceId)}`, { method: "DELETE" }),
  approveDesktopPairing: (code: string, provider: "github" | "azure", providerToken?: string) => request<{ approved: boolean }>(
    "/desktop/pairings/approve", { method: "POST", body: jsonBody({ code, provider, providerToken }) }),
  updateProfile: (displayName: string, avatarUrl: string, bio: string) => request<Record<string, unknown>>(
    "/account/profile", { method: "PUT", body: jsonBody({ displayName, avatarUrl, bio }) }),
  setPluginGrant: (pluginId: string, scopes: string[]) => request<Record<string, unknown>>(
    `/account/plugins/${pluginId}/grants`, { method: "PUT", body: jsonBody({ scopes }) }),
  deletePluginData: (pluginId: string) => request<{ deleted: number }>(
    `/account/plugins/${pluginId}/data`, { method: "DELETE" }),
  listMyMemberships: async () => {
    const body = await request<{ items?: unknown[] } | unknown[]>("/publisher/me/memberships");
    return unwrapItems<Record<string, any>>(body);
  },
  listMyNamespaces: async () => {
    const body = await request<{ items?: unknown[] } | unknown[]>("/publisher/me/namespaces");
    return unwrapItems<Record<string, any>>(body);
  },
  listMyPlugins: async () => {
    const body = await request<{ items?: unknown[] } | unknown[]>("/publisher/me/plugins");
    return unwrapItems<Record<string, any>>(body);
  },
  listAdminPlugins: async () => {
    const body = await request<{ items?: unknown[] } | unknown[]>("/admin/plugins");
    return unwrapItems<Record<string, any>>(body);
  },
  listMyVersions: async () => {
    const body = await request<{ items?: unknown[] } | unknown[]>("/publisher/me/versions");
    return unwrapItems<Record<string, any>>(body);
  },
  listMyReviews: async () => {
    const body = await request<{ items?: unknown[] } | unknown[]>("/publisher/me/reviews");
    return unwrapItems<Record<string, any>>(body);
  },
  getPayoutProfile: async (organizationId: string) =>
    request<{ accountMask: string | null; updatedAt: string | null }>(
      `/publisher/organizations/${organizationId}/payout-profile`,
      {},
      true
    ),
  listWithdrawals: async (organizationId: string) => {
    const body = await request<{ items?: unknown[] } | unknown[]>(
      `/publisher/organizations/${organizationId}/withdrawals`
    );
    return unwrapItems<Record<string, any>>(body);
  },
  createOrganization: (input: CreateOrganizationInput) => request<Record<string, unknown>>(
    "/publisher/organizations",
    { method: "POST", body: jsonBody(input) }
  ),
  createNamespace: (organizationId: string, input: CreateNamespaceInput) => request<Record<string, unknown>>(
    `/publisher/organizations/${organizationId}/namespaces`,
    { method: "POST", body: jsonBody(input) }
  ),
  createPlugin: (input: CreatePluginInput) => request<Record<string, unknown>>(
    "/publisher/plugins",
    { method: "POST", body: jsonBody(input) }
  ),
  updatePlugin: (pluginId: string, input: UpdatePluginInput) => request<Record<string, unknown>>(
    `/publisher/plugins/${pluginId}`,
    { method: "PUT", body: jsonBody(input) }
  ),
  uploadPluginIcon: (pluginId: string, icon: File) => {
    const form = new FormData();
    form.set("icon", icon);
    return request<Record<string, unknown>>(`/publisher/plugins/${pluginId}/icon`, { method: "POST", body: form });
  },
  removePluginIcon: (pluginId: string) => request<{ removed: boolean }>(
    `/publisher/plugins/${pluginId}/icon`, { method: "DELETE" }),
  /**
   * Upload strategy (Cloudflare Worker / api.pcln.top):
   * - &lt;12 MiB: multipart FormData through the Worker
   * - larger: upload-session → PUT upload-part (Worker→R2) → finalize
   */
  uploadVersion: async (input: UploadVersionInput) => {
    const smallFormThreshold = 12 * 1024 * 1024;
    if (input.package.size <= smallFormThreshold) {
      const form = new FormData();
      form.set("version", input.version);
      form.set("channel", input.channel);
      form.set("releaseNotes", input.releaseNotes);
      form.set("minimumLauncherVersion", input.minimumLauncherVersion);
      form.set("package", input.package);
      return request<{ version: Record<string, unknown>; scan: Record<string, unknown> }>(
        `/publisher/plugins/${input.pluginId}/versions`,
        { method: "POST", body: form }
      );
    }

    const packageSha256 = await sha256Hex(input.package);
    const session = await request<{
      mode: "single" | "multipart";
      multipart?: boolean;
      objectPath: string;
      manifestPath?: string;
      uploadUri?: string;
      token?: string;
      signedUrl?: string;
      path?: string;
      version: string;
      channel: string;
      packageSha256: string;
      packageSize: number;
      chunkSize: number;
      freePlanMaxObjectBytes: number;
      parts?: Array<{
        index: number;
        path: string;
        maxSize: number;
        uploadUri?: string;
        token?: string;
        signedUrl?: string;
        uploadPath?: string;
      }>;
    }>(`/publisher/plugins/${input.pluginId}/versions/upload-session`, {
      method: "POST",
      body: JSON.stringify({
        version: input.version,
        channel: input.channel,
        packageSha256,
        packageSize: input.package.size
      })
    });

    if (session.mode === "multipart" && session.parts?.length) {
      const uploadedParts: Array<{ index: number; path: string; size: number; sha256: string }> = [];
      for (const part of session.parts) {
        const start = part.index * session.chunkSize;
        const end = Math.min(start + part.maxSize, input.package.size);
        const slice = input.package.slice(start, end);
        const partSha = await sha256Hex(slice);
        if (!part.uploadUri) {
          throw new PluginCenterApiError(
            `分块上传缺少 uploadUri (part ${part.index})`,
            502
          );
        }
        await uploadBytesToWorker(part.uploadUri, slice, partSha);
        uploadedParts.push({
          index: part.index,
          path: part.path,
          size: slice.size,
          sha256: partSha
        });
      }

      return request<{ version: Record<string, unknown>; scan: Record<string, unknown> }>(
        `/publisher/plugins/${input.pluginId}/versions/finalize`,
        {
          method: "POST",
          body: JSON.stringify({
            mode: "multipart",
            multipart: true,
            version: input.version,
            channel: input.channel,
            manifestPath: session.manifestPath || session.objectPath,
            packageSha256,
            packageSize: input.package.size,
            parts: uploadedParts,
            releaseNotes: input.releaseNotes,
            changelog: input.releaseNotes,
            minimumLauncherVersion: input.minimumLauncherVersion
          })
        }
      );
    }

    if (!session.uploadUri) {
      throw new PluginCenterApiError("上传会话未返回 uploadUri", 502);
    }
    await uploadBytesToWorker(session.uploadUri, input.package, packageSha256);

    return request<{ version: Record<string, unknown>; scan: Record<string, unknown> }>(
      `/publisher/plugins/${input.pluginId}/versions/finalize`,
      {
        method: "POST",
        body: JSON.stringify({
          mode: "single",
          version: input.version,
          channel: input.channel,
          objectPath: session.objectPath,
          packageSha256,
          packageSize: input.package.size,
          releaseNotes: input.releaseNotes,
          changelog: input.releaseNotes,
          minimumLauncherVersion: input.minimumLauncherVersion
        })
      }
    );
  },
  submitVersion: (versionId: string, publisherNotes: string) => request<Record<string, unknown>>(
    `/publisher/versions/${versionId}/submit`,
    { method: "POST", body: jsonBody({ publisherNotes }) }
  ),
  claimReview: (reviewId: string) => request<Record<string, unknown>>(
    `/admin/reviews/${reviewId}/claim`,
    { method: "POST" }
  ),
  decideReview: (reviewId: string, decision: string, reason: string) => request<Record<string, unknown>>(
    `/admin/reviews/${reviewId}/decision`,
    { method: "POST", body: jsonBody({ decision, reason }) }
  ),
  verifyNamespace: (namespaceId: string, verified: boolean) => request<Record<string, unknown>>(
    `/admin/namespaces/${namespaceId}/verification`,
    { method: "POST", body: jsonBody({ verified }) }
  ),
  setOrganizationStatus: (organizationId: string, status: string) => request<Record<string, unknown>>(
    `/admin/organizations/${organizationId}/status`,
    { method: "POST", body: jsonBody({ status }) }
  ),
  listAdminMembers: () => request<{
    members: Array<{
      userId: string;
      role: string;
      createdBy: string | null;
      createdAt: string;
      displayName: string;
      githubLogin: string | null;
      avatarUrl: string | null;
      email: string | null;
      isSuperAdmin?: boolean;
    }>;
    canManageMembers: boolean;
    superAdminUserId: string;
  }>("/admin/members"),
  appointAdminMember: (userId: string, role: "admin" | "reviewer" | "auditor" = "admin") =>
    request<Record<string, unknown>>("/admin/members", {
      method: "POST",
      body: jsonBody({ userId, role })
    }),
  revokeAdminMember: (userId: string) => request<{ revoked: boolean }>(
    `/admin/members/${encodeURIComponent(userId)}`,
    { method: "DELETE" }
  ),
  listAdminAnnouncements: () => request<{ announcements: Record<string, unknown>[] }>(
    "/admin/announcements"
  ),
  upsertAdminAnnouncement: (input: {
    id: string;
    enabled: boolean;
    severity: "info" | "important" | "security";
    priority: number;
    startsAt?: string;
    endsAt?: string | null;
    minimumVersion?: string | null;
    maximumVersionExclusive?: string | null;
    channels?: string[];
    platforms?: string[];
    dismissible?: boolean;
    localizedContent: Record<string, {
      title: string;
      body: string;
      primaryLabel?: string;
      actionLabel?: string;
      actionUrl?: string;
    }>;
  }) => request<{ announcement: Record<string, unknown> }>(
    "/admin/announcements",
    { method: "PUT", body: jsonBody(input) }
  ),
  deleteAdminAnnouncement: (id: string) => request<{ deleted: boolean }>(
    `/admin/announcements/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  )
};
