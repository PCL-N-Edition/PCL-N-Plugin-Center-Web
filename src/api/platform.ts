export interface Session { id: string; name: string; email?: string | null; scope: 'console' | 'operations' }
export interface StoreItem { id: string; name: string; summary: string; category: string; version: string; publisher: string; description: string }
export interface Ticket { id: string; subject: string; body: string; status: string; created_at: string; version: number }
export class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }

const AUTH_BASE = 'https://auth.pcln.top';
let accessToken = '', currentUser: Session | undefined, restoring: Promise<Session | undefined> | undefined;

const authHeaders = (): Record<string, string> => accessToken ? { Authorization: 'Bearer ' + accessToken } : {};

async function authFetch(path: string, init: RequestInit = {}) {
  return fetch(AUTH_BASE + path, {
    ...init, credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-Nexa-Request': '1', ...authHeaders(), ...init.headers },
    signal: init.signal ?? AbortSignal.timeout(15000)
  });
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    ...init, credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-Nexa-Request': '1', ...authHeaders(), ...init.headers },
    signal: init.signal ?? AbortSignal.timeout(15000)
  });
  if (response.status === 204) return undefined as T;
  if (!response.headers.get('content-type')?.match(/application\/(?:problem\+)?json/)) throw new Error('暂时无法连接平台服务，请稍后重试。');
  const body = await response.json();
  if (!response.ok) throw new ApiError(body.detail || body.message || `请求失败 (${response.status})`, response.status);
  return body as T;
}

export interface Page<T> { data: T[]; pagination: { limit: number; offset: number; total: number } }

// 访问令牌仅保存在内存中；页面刷新后用 auth 域 Cookie 会话静默换取新令牌。
async function mintToken(): Promise<Session | undefined> {
  const response = await authFetch('/auth/v1/tokens', { method: 'POST', body: '{}' });
  if (!response.ok) return undefined;
  const data = await response.json() as { token: string; user: { id: string; name: string; email?: string | null } };
  if (!data.token || !data.user?.id) return undefined;
  accessToken = data.token;
  currentUser = { ...data.user, scope: 'console' };
  return currentUser;
}

export const platform = {
  oauthStart: (provider: 'github' | 'microsoft' | 'google', returnTo = '/account', mode: 'login' | 'link' = 'login') => {
    const target = new URL(`/auth/v1/oauth/${provider}/start`, AUTH_BASE);
    target.searchParams.set('return_to', returnTo);
    target.searchParams.set('mode', mode);
    target.searchParams.set('scope', 'console');
    window.location.assign(target.toString());
  },
  session: () => {
    if (currentUser) return Promise.resolve(currentUser);
    restoring ??= mintToken().catch(() => undefined).finally(() => { restoring = undefined; });
    return restoring;
  },
  logout: async () => {
    try { await authFetch('/auth/v1/sessions/current?scope=console', { method: 'DELETE' }); } catch { /* 网络失败也要清除本地凭证 */ }
    accessToken = ''; currentUser = undefined;
  },
  catalog: (query: URLSearchParams) => request<Page<StoreItem>>('/resources?' + query),
  resource: (id: string) => request<StoreItem>('/resources/' + encodeURIComponent(id)),
  tickets: (scope: string, offset=0) => request<Page<Ticket>>(`/tickets?scope=${scope}&limit=50&offset=${offset}`),
  createTicket: (subject: string, body: string) => request('/tickets', { method: 'POST', body: JSON.stringify({ subject, body }) }),
  resolve: (ticket: Ticket) => request(`/tickets/${encodeURIComponent(ticket.id)}`, { method: 'PATCH', headers: { 'If-Match': '"' + ticket.version + '"' }, body: JSON.stringify({ status: 'resolved' }) })
};
