// Compatibility shim: hosting prep lives in prepare-static-hosting.mjs
// (Cloudflare Pages primary; also materializes SPA shells for static hosts).
await import("./prepare-static-hosting.mjs");
