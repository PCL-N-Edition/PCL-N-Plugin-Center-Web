import { request } from './platform';
export interface LauncherRolloutRule {
  id: string; kind: "update" | "feature"; target: string; basisPoints: number;
  channels: string[]; rids: string[]; expiresAt: string; enabled: boolean;
}
export interface LauncherRolloutPolicy { revision: number; rules: LauncherRolloutRule[] }
export interface LauncherDiagnostics {
  days: number; since: string; until: string; generatedAt: string;
  histograms: { metric: string; bucket: number; count: number; total: number; min: number; max: number }[];
  trends: { day: string; metric: string; mean: number; peak: number; count: number }[];
  errors: { fingerprint: string; category: string; severity: string; code: string; stack: string; last_seen: string; count: number; issue_number: number | null; issue_state: string | null; issue_updated: string | null }[];
  features: { feature: string; event: string; count: number }[];
  sessions: number; sync: { last_attempt: string; last_success: string | null; status: string } | null;
  featureCatalog: string[]; metricCatalog: string[];
}

const jsonBody = JSON.stringify;
export const pluginCenterApi = {
  launcherRunSummary: (days:number,version='',os='') => request<{groups:{version:string;os:string;loader:string;runs:number;ended:number;elapsed:number;peak:number|null}[];settings:{loader:string;render:string;simulation:string;runs:number;working:number|null}[];mods:{id:string;version:string;runs:number}[]}>(`/telemetry/run-summaries?days=${days}&version=${encodeURIComponent(version)}&os=${encodeURIComponent(os)}`),
  launcherRuns: (days:number,version='',os='') => request<{runs:{run:string;version:string;os:string;day:string;elapsed:number;ended:number;samples:number}[]}>(`/telemetry/runs?days=${days}&version=${encodeURIComponent(version)}&os=${encodeURIComponent(os)}`),
  launcherRun: (run:string,after=-1) => request<{samples:Record<string,string>[];mods:Record<string,string>[];next:number|null}>(`/telemetry/runs?run=${encodeURIComponent(run)}&after=${after}`),
  launcherDiagnostics: (days: number, version = "", os = "") => request<LauncherDiagnostics>(`/telemetry/diagnostics?${new URLSearchParams({ days: String(days), version, os })}`),
  syncDiagnosticIssues: () => request<{ status: string; linked?: number }>("/telemetry/issue-syncs", { method: "POST" }),
  launcherRollouts: () => request<LauncherRolloutPolicy>("/rollout-policies/current"),
  saveLauncherRollouts: (policy: LauncherRolloutPolicy) => request<LauncherRolloutPolicy>("/rollout-policies/current", { method: "PUT", headers: { "If-Match": `"${policy.revision}"` }, body: jsonBody(policy) }),
  launcherTelemetry: (days: number, level: string = "all", version = "", os = "") => request<{
    days: number; since: string; until: string; generatedAt: string;
    daily: { day: string; event: string; result: string; count: number }[];
    versions: { version: string; count: number }[];
    platforms: { os: string; arch: string; count: number }[];
  }>(`/telemetry/summary?days=${days}&level=${encodeURIComponent(level)}&version=${encodeURIComponent(version)}&os=${encodeURIComponent(os)}`),
};
