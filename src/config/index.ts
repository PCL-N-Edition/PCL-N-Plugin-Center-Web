// 全局默认配置项
// 首页地址[默认]
export const HOME_URL: string = "/home";

// 跳转子页面静态路由父级节点
export const STATIC_URL: string = "/system/static";

// 登录页地址[默认]
export const LOGIN_URL: string = "/login";

// pinia仓库前缀
export const CACHE_PREFIX: string = "pcl-plugin-center-";

// Svg本地图片使用 koi- 开头才会生效
export const SVG_PREFIX: string = "koi-";

// 默认主题颜色
export const DEFAULT_THEME: string = "#4F6EF7";

// 路由白名单地址[本地存在的路由 staticRouter.ts 中] — 无需登录
export const ROUTER_WHITE_LIST: string[] = [
  "/",
  "/download",
  "/download/**",
  "/download/thanks",
  "/500",
  "/403",
  "/404",
  "/market",
  "/market/**",
  "/legal/accept",
  "/login"
];

/** True for marketing/public pages that must never force login. */
export function isPublicRoutePath(path: string): boolean {
  const normalized = (path.replace(/\/+$/, "") || "/").toLowerCase();
  if (
    normalized === "/" ||
    normalized === "/download" ||
    normalized.startsWith("/download/") ||
    normalized === "/market" ||
    normalized.startsWith("/market/") ||
    normalized === "/login" ||
    normalized === "/legal/accept" ||
    normalized === "/500" ||
    normalized === "/403" ||
    normalized === "/404"
  ) {
    return true;
  }
  return ROUTER_WHITE_LIST.some(pattern => {
    // Inline match (avoid circular import with utils)
    const regexPattern = pattern
      .replace(/\//g, "\\/")
      .replace(/\*\*/g, "__DOUBLE_STAR__")
      .replace(/\*/g, "[^\\/]*")
      .replace(/__DOUBLE_STAR__/g, ".*");
    return new RegExp(`^${regexPattern}$`, "i").test(path) ||
      new RegExp(`^${regexPattern}$`, "i").test(normalized);
  });
}
