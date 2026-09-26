// Web has no business tables or authentication implementation. Bindings target separately deployed projects.
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    try {
      if (path.startsWith('/api/')) return await env.API.fetch(request);
      if (path.startsWith('/auth/')) return await env.AUTH.fetch(request);
      // Cloudflare 边缘国家码：供定价页本地化价格预览；缺失时返回 null，
      // 前端不传国家码，由 Paddle 按访客 IP 自动定位。
      if (path === '/geo.json') return Response.json({ country: request.cf?.country ?? null }, { headers: { 'cache-control': 'no-store' } });
      return await env.ASSETS.fetch(request);
    } catch {
      return Response.json({ type: 'about:blank', title: 'Service Unavailable', status: 503, detail: '服务暂时不可用' }, { status: 503, headers: { 'content-type': 'application/problem+json', 'cache-control': 'no-store' } });
    }
  }
};
