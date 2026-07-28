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

const request = async <T>(path: string, init: RequestInit = {}, authenticated = true): Promise<T> => {
  const headers = new Headers(init.headers);
  headers.set("apikey", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
  if (authenticated) {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    const accessToken = data.session?.access_token;
    if (!accessToken) throw new PluginCenterApiError("请先登录", 401);
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");

  const response = await fetch(`${import.meta.env.VITE_WEB_BASE_API}/v1${path}`, {
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
        "上传失败：Edge Function 算力/内存不足（WORKER_RESOURCE_LIMIT）。" +
        "请刷新后重试大包分块上传流程。";
    }
    if (
      String(message).includes("maximum allowed size") ||
      String(message).includes("Payload too large") ||
      code === "413" ||
      response.status === 413
    ) {
      message =
        "Storage 拒绝了对象大小（通常是 Supabase Free 单文件 50 MB 硬限制）。" +
        "请刷新页面后重试：前端会对 >50 MB 的 .pnp 自动拆成 40 MB 分块上传。";
    }
    throw new PluginCenterApiError(message, response.status);
  }
  return body as T;
};

/** Browser SHA-256 of a File/Blob as lowercase hex (for direct Storage upload sessions). */
export async function sha256Hex(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

const jsonBody = (value: unknown) => JSON.stringify(value);

export const pluginCenterApi = {
  listMarketPlugins: (query: { search?: string; category?: string; locale?: string; skip?: number; take?: number } = {}) => {
    const parameters = new URLSearchParams();
    if (query.search) parameters.set("search", query.search);
    if (query.category) parameters.set("category", query.category);
    if (query.locale) parameters.set("locale", query.locale);
    parameters.set("skip", String(query.skip ?? 0));
    parameters.set("take", String(query.take ?? 50));
    return request<MarketPlugin[]>(`/plugins?${parameters}`, {}, false);
  },
  getMarketPlugin: (pluginId: string, locale?: string) => request<MarketPlugin>(
    `/plugins/${encodeURIComponent(pluginId)}${locale ? `?locale=${encodeURIComponent(locale)}` : ""}`, {}, false),
  listCategories: () => request<MarketCategory[]>("/categories", {}, false),
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
   * Upload strategy:
   * - &lt;12 MiB: multipart FormData through Edge (simple path)
   * - 12–50 MiB: single signed Storage object
   * - &gt;50 MiB: split into ≤40 MiB parts (Supabase Free hard-caps each object at 50 MB)
   *   upload-session → upload each part → finalize (reassemble + light scan)
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
        token: string;
        signedUrl: string;
        uploadPath: string;
        maxSize: number;
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
        const { error: uploadError } = await supabase.storage
          .from("plugin-packages")
          .uploadToSignedUrl(part.uploadPath || part.path, part.token, slice, {
            contentType: "application/octet-stream",
            upsert: false
          });
        if (uploadError) {
          throw new PluginCenterApiError(
            uploadError.message ||
              `分块上传失败 (part ${part.index}/${session.parts.length - 1})`,
            400
          );
        }
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
            version: input.version,
            channel: input.channel,
            manifestPath: session.manifestPath || session.objectPath,
            packageSha256,
            parts: uploadedParts,
            releaseNotes: input.releaseNotes,
            minimumLauncherVersion: input.minimumLauncherVersion
          })
        }
      );
    }

    // Single-object direct upload (&lt;= Free 50 MB object cap)
    const { error: uploadError } = await supabase.storage
      .from("plugin-packages")
      .uploadToSignedUrl(session.path || session.objectPath, session.token!, input.package, {
        contentType: "application/octet-stream",
        upsert: false
      });
    if (uploadError) {
      const msg = uploadError.message || "直传 Storage 失败";
      if (msg.includes("maximum allowed size") || msg.includes("413")) {
        throw new PluginCenterApiError(
          "Storage 单文件超过 Free 计划 50 MB 上限。请刷新页面后重试（大包会自动分块上传）。",
          413
        );
      }
      throw new PluginCenterApiError(msg, 400);
    }

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
          releaseNotes: input.releaseNotes,
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
