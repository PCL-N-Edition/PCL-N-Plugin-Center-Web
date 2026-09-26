export interface Session { id: string; name: string; scope: 'console' | 'operations' }
export interface StoreItem { id: string; name: string; summary: string; category: string; version: string; publisher: string; description: string }
export interface Ticket { id: string; subject: string; body: string; status: string; created_at: string; version: number }
export class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }
export async function request<T>(path: string, init: RequestInit = {}, base = "/api/v1"): Promise<T> {
  const response = await fetch(`${base}${path}`, {
    ...init, credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-Nexa-Request': '1', ...init.headers },
    signal: init.signal ?? AbortSignal.timeout(15000)
  });
  if (response.status === 204) return undefined as T;
  if (!response.headers.get('content-type')?.match(/application\/(?:problem\+)?json/)) throw new Error('暂时无法连接平台服务，请稍后重试。');
  const body = await response.json();
  if (!response.ok) throw new ApiError(body.detail || body.message || `请求失败 (${response.status})`, response.status);
  return body as T;
}
export interface Page<T> { data: T[]; pagination: { limit: number; offset: number; total: number } }
export const platform = {
  session: (scope: string) => request<Session>(`/sessions/current?scope=${scope}`, {}, '/auth/v1'),
  login: (name: string, password: string, scope: string) => request<Session>('/sessions', { method: 'POST', body: JSON.stringify({ name, password, scope }) }, '/auth/v1'),
  logout: (scope: string) => request('/sessions/current?scope=' + scope, { method: 'DELETE' }, '/auth/v1'),
  catalog: (query: URLSearchParams) => request<Page<StoreItem>>('/resources?' + query),
  resource: (id: string) => request<StoreItem>('/resources/' + encodeURIComponent(id)),
  tickets: (scope: string, offset=0) => request<Page<Ticket>>(`/tickets?scope=${scope}&limit=50&offset=${offset}`),
  createTicket: (subject: string, body: string) => request('/tickets', { method: 'POST', body: JSON.stringify({ subject, body }) }),
  resolve: (ticket: Ticket) => request(`/tickets/${encodeURIComponent(ticket.id)}`, { method: 'PATCH', headers: { 'If-Match': '"' + ticket.version + '"' }, body: JSON.stringify({ status: 'resolved' }) })
};
