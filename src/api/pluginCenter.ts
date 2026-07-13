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

export class PluginCenterApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const accessToken = data.session?.access_token;
  if (!accessToken) throw new PluginCenterApiError("登录已过期，请重新登录", 401);

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  headers.set("apikey", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
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
