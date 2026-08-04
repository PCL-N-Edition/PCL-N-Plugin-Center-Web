import { createRouter, createWebHashHistory, createWebHistory } from "vue-router";
import { layoutRouter, staticRouter, errorRouter } from "@/routers/modules/staticRouter";
import nprogress from "@/utils/nprogress";
import { RouteLocationNormalized } from "vue-router";
import useUserStore from "@/stores/modules/user.ts";
import useAuthStore from "@/stores/modules/auth.ts";
import { LOGIN_URL, isPublicRoutePath } from "@/config/index.ts";
import { hasAcceptedNCloudLegal } from "@/utils/legal";
import { ElMessageBox } from 'element-plus';
import { useDebounceFn } from '@vueuse/core';
import { initDynamicRouter, isDynamicRoutesMissing } from "@/routers/modules/dynamicRouter.ts";
import { getMenuLanguage } from "@/utils/index.ts";
import { completeOAuthCallback } from "@/lib/supabase";
import {
  PRIMARY_STORE_ORIGIN,
  buildExternalRoute,
  consumeStoreAuthHandoff,
  handoffSessionToStore,
  isAuthHost,
  isAuthOnlyPath,
  isLocalAuthHost,
  isPrimaryStoreHost,
  replaceExternalRoute,
  replaceWithAuthLogin
} from "@/utils/authHosts";

const normalizeOAuthErrorRedirect = () => {
  const currentUrl = new URL(window.location.href);
  const hashError = currentUrl.hash.match(/^#\/?error=([^&]+)/);
  const error = currentUrl.searchParams.get("error") ?? (hashError ? decodeURIComponent(hashError[1]) : null);
  const description = currentUrl.searchParams.get("error_description");
  if (!error) return;

  sessionStorage.setItem(
    "pcln-oauth-error",
    description ? decodeURIComponent(description) : error
  );
  const target = sessionStorage.getItem("pcln-pending-link-provider")
    ? "/account?identityLinkError=1"
    : "/login?oauthError=1";
  // History path only — no #/login prefix.
  window.history.replaceState(window.history.state, document.title, target);
};

normalizeOAuthErrorRedirect();

// .env配置文件读取 — login/auth always use history paths (no #).
const mode = import.meta.env.VITE_ROUTER_MODE;
const useHashRouter = mode === "hash";

// Preserve links issued by previous hash-router deployments while exposing
// clean, indexable URLs to search engines and new navigation.
if (!useHashRouter && window.location.hash.startsWith("#/")) {
  const legacyRoute = window.location.hash.slice(1);
  window.history.replaceState(window.history.state, document.title, legacyRoute);
}

// 创建路由器对象 — prefer history (no #) unless explicitly configured for hash.
const router = createRouter({
  history: useHashRouter
    ? createWebHashHistory(import.meta.env.BASE_URL)
    : createWebHistory(import.meta.env.BASE_URL),
  routes: [...layoutRouter, ...staticRouter, ...errorRouter],
  strict: false,
  // 滚动行为
  scrollBehavior() {
    return {
      left: 0,
      top: 0
    };
  }
});

/**
 * @description 前置路由
 * Vue Router 4.x 新语法：不再使用 next() 回调，直接返回路由对象或 true/false
 */
router.beforeEach(async (to: RouteLocationNormalized, from: RouteLocationNormalized) => {
  const userStore = useUserStore();
  const authStore = useAuthStore();

  try {
    // Store host: absorb session handoff from auth.pcln.top before other guards.
    const handoffRedirect = await consumeStoreAuthHandoff();
    if (handoffRedirect) {
      await userStore.restoreSession(true);
      // Navigate through a fresh guard pass so dynamic routes still initialize.
      if (to.path === "/auth/callback" || to.path.endsWith("/auth/callback")) {
        return { path: handoffRedirect, replace: true };
      }
      return handoffRedirect.startsWith("/")
        ? { path: handoffRedirect, replace: true }
        : handoffRedirect;
    }

    await completeOAuthCallback();
    await userStore.restoreSession();
  } catch (error) {
    console.warn("Supabase 会话恢复失败", error);
    userStore.setToken("");
  }

  // 1、NProgress 开始
  nprogress.start();
  // 2、标题切换，没有放置后置路由，是因为页面路径不存在，title会变成undefined
  document.title = getMenuLanguage(to.meta?.title as string) || "PCL.N 插件中心";

  // 3、登录页：生产环境统一在 auth.pcln.top；主站仅重定向过去。
  if (to.path.toLocaleLowerCase() === LOGIN_URL) {
    if (userStore.token) {
      const requestedRedirect = typeof to.query.redirect === "string" && to.query.redirect.startsWith("/")
        ? to.query.redirect
        : from.fullPath && from.fullPath !== LOGIN_URL ? from.fullPath : "/market";
      if (isAuthHost() && !isLocalAuthHost()) {
        await handoffSessionToStore(requestedRedirect);
        return false;
      }
      return requestedRedirect;
    }
    // Primary store must not host the login UI.
    if (isPrimaryStoreHost() && !isLocalAuthHost()) {
      const requestedRedirect = typeof to.query.redirect === "string" && to.query.redirect.startsWith("/")
        ? to.query.redirect
        : "/market";
      replaceWithAuthLogin(requestedRedirect);
      return false;
    }
    // 登录页需要清空路由，否则会显示之前的路由。
    resetRouter();
    return true;
  }

  // 4、公开页（下载/市场/首页等）一律放行，不要求登录。
  if (isPublicRoutePath(to.path)) {
    if (isAuthHost() && !isLocalAuthHost()) {
      // auth 只承载登录/协议；其余公开路径（下载、市场）回主站。
      if (userStore.token && !isAuthOnlyPath(to.path)) {
        await handoffSessionToStore(to.fullPath);
        return false;
      }
      if (!isAuthOnlyPath(to.path)) {
        if (to.path === "/" || to.path === "") {
          return { path: LOGIN_URL, replace: true };
        }
        replaceExternalRoute(PRIMARY_STORE_ORIGIN, to.fullPath);
        return false;
      }
    }
    return true;
  }

  // auth.pcln.top 只承载身份认证。登录后把会话移交主站。
  if (isAuthHost() && !isLocalAuthHost()) {
    if (userStore.token) {
      if (to.path === "/legal/accept" && !hasAcceptedNCloudLegal()) {
        return true;
      }
      await handoffSessionToStore(to.fullPath);
      return false;
    }
    if (isAuthOnlyPath(to.path)) {
      return true;
    }
    return { path: LOGIN_URL, query: { redirect: to.fullPath }, replace: true };
  }

  // 5、判断是否有 Token，没有重定向到 login 页面。
  if (!userStore.token) {
    if (isPrimaryStoreHost() && !isLocalAuthHost()) {
      replaceWithAuthLogin(to.fullPath);
      return false;
    }
    return { path: LOGIN_URL, query: { redirect: to.fullPath }, replace: true };
  }

  // 5b、首次登录/注册后须同意 N Cloud 用户协议与隐私政策（版本见 legal.ts）。
  if (
    to.path !== "/legal/accept" &&
    to.path.toLocaleLowerCase() !== LOGIN_URL &&
    !hasAcceptedNCloudLegal()
  ) {
    return {
      path: "/legal/accept",
      query: { redirect: to.fullPath },
      replace: true
    };
  }

  // 6、无菜单数据，或菜单在 store 中但路由未注册（如 resetRouter 后），需重新拉取/注册动态路由
  const menuList = authStore.getMenuList;
  if (!menuList.length || isDynamicRoutesMissing(menuList)) {
    try {
      await initDynamicRouter();
      if (!userStore.token) {
        if (isPrimaryStoreHost() && !isLocalAuthHost()) {
          replaceWithAuthLogin(to.fullPath);
          return false;
        }
        return { path: LOGIN_URL, replace: true };
      }
      return { ...to, replace: true };
    } catch {
      if (isPrimaryStoreHost() && !isLocalAuthHost()) {
        replaceWithAuthLogin(to.fullPath);
        return false;
      }
      return { path: LOGIN_URL, replace: true };
    }
  }
  
  // 7、正常访问页面。
  return true; // 允许访问
});

/**
 * @description 重置路由
 */
export const resetRouter = () => {
  const authStore = useAuthStore();
  if (!authStore.getMenuList.length) {
    return;
  }
  authStore.getMenuList.forEach((route: any) => {
    const { name } = route;
    if (name && router.hasRoute(name)) {
      router.removeRoute(name);
    }
  });
};

/**
 * @description 路由跳转错误
 */
router.onError((error: any) => {
  // 结束全屏动画
  nprogress.done();
  console.warn("路由错误", error.message);
  // 匹配动态导入模块失败的特定错误信息
  if (error.message.includes('Failed to fetch dynamically imported module')) {
    // 调用防抖后的刷新函数
    failFetchModule();
  }
});

/**
 * @description 后置路由
 */
// @ts-ignore
router.afterEach(() => {
  // 结束全屏动画
  nprogress.done();
});

/**
 * 处理路由模块加载失败的逻辑
 * @description 当动态导入的组件（路由懒加载）加载失败时，提示用户并刷新页面
 */
export const failFetchModule = useDebounceFn(() => {
  ElMessageBox.confirm('页面加载失败，是否刷新?', '提示', {
    type: 'warning',
    // 确认按钮的文本
    confirmButtonText: '刷新',
    // 取消按钮的文本
    cancelButtonText: '取消'
  })
    .then(() => {
      // 确认刷新，强制重新加载整个页面
      window.location.reload();
    })
    .catch(() => {
      // 用户点击取消，可以在这里记录错误日志或执行其他逻辑
      console.log('用户取消了刷新');
    });
}, 1500);

export default router;

// Re-export for callers that previously imported helpers from the router module.
export { buildExternalRoute, replaceExternalRoute, PRIMARY_STORE_ORIGIN };
