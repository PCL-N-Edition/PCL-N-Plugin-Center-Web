// Web has no business tables or authentication implementation. Bindings target separately deployed projects.
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    try {
      if (path.startsWith('/api/')) return await env.API.fetch(request);
      if (path.startsWith('/auth/')) return await env.AUTH.fetch(request);
      return await env.ASSETS.fetch(request);
    } catch {
      return Response.json({ type: 'about:blank', title: 'Service Unavailable', status: 503, detail: '服务暂时不可用' }, { status: 503, headers: { 'content-type': 'application/problem+json', 'cache-control': 'no-store' } });
    }
  }
};
