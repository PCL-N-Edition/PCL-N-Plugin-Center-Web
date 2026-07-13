import { supabase } from "@/lib/supabase";

export interface CreateOrganizationInput {
  slug: string;
  displayName: string;
}

export interface CreateNamespaceInput {
  namespace: string;
}

export interface CreatePluginInput {
  organizationId: string;
  namespaceId: string;
  pluginId: string;
  displayName: string;
  summary: string;
  description: string;
  repositoryUrl?: string;
  visibility: string;
}

export interface UpdatePluginInput {
  displayName: string;
  summary: string;
  description: string;
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
}

export interface MarketCategory { id: string; name: string; description?: string; }
export interface MarketMetadataInput { categoryId: string; tags: string[]; pricingModel: string; priceCents: number; }

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
  const body = contentType.includes("application/json") ? await response.json() : null;
  if (!response.ok) {
    const message = body?.detail ?? body?.title ?? `请求失败（HTTP ${response.status}）`;
    throw new PluginCenterApiError(message, response.status);
  }
  return body as T;
};

const jsonBody = (value: unknown) => JSON.stringify(value);

export const pluginCenterApi = {
  listMarketPlugins: (query: { search?: string; category?: string; skip?: number; take?: number } = {}) => {
    const parameters = new URLSearchParams();
    if (query.search) parameters.set("search", query.search);
    if (query.category) parameters.set("category", query.category);
    parameters.set("skip", String(query.skip ?? 0));
    parameters.set("take", String(query.take ?? 50));
    return request<MarketPlugin[]>(`/plugins?${parameters}`, {}, false);
  },
  getMarketPlugin: (pluginId: string) => request<MarketPlugin>(`/plugins/${encodeURIComponent(pluginId)}`, {}, false),
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
  uploadVersion: (input: UploadVersionInput) => {
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
  )
};
