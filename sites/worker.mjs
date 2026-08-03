/**
 * Optional Cloudflare Pages Advanced Mode worker (ASSETS binding).
 * Primary production deploy is static `dist/` + `public/_redirects` SPA fallback.
 * Keep this for `pnpm build:sites` if you enable Functions / Advanced Mode later.
 */
const worker = {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404) return response;

    const fallbackUrl = new URL(request.url);
    fallbackUrl.pathname = "/index.html";
    return env.ASSETS.fetch(new Request(fallbackUrl, request));
  }
};

export default worker;
