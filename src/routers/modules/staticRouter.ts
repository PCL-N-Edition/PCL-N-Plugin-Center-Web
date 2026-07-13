import type { RouteRecordRaw } from "vue-router";
import { HOME_URL, LOGIN_URL } from "@/config";
import Layout from "@/layouts/index.vue";

export const layoutRouter: RouteRecordRaw[] = [
  {
    path: "/market",
    name: "publicMarket",
    component: () => import("@/views/market/index.vue"),
    meta: { title: "插件市场" }
  },
  {
    path: "/market/plugins/:pluginId",
    name: "publicMarketDetail",
    component: () => import("@/views/market/detail.vue"),
    meta: { title: "插件详情" }
  },
  {
    path: "/account",
    name: "onlineAccount",
    component: () => import("@/views/account/index.vue"),
    meta: { title: "PCL N 在线服务账户" }
  },
  {
    path: LOGIN_URL,
    name: "login",
    component: () => import("@/views/login/index.vue"),
    meta: { title: "登录" }
  }
];

export const staticRouter: RouteRecordRaw[] = [
  {
    path: "/",
    name: "layout",
    component: Layout,
    redirect: HOME_URL,
    meta: {
      menuId: "-1",
      title: "PCL.N 插件中心",
      icon: "koi-home",
      isVisible: "1",
      linkUrl: "",
      isKeepAlive: "1",
      isTag: "0",
      isAffix: "1"
    },
    children: [
      {
        path: HOME_URL,
        name: "homePage",
        component: () => import("@/views/home/index.vue"),
        meta: {
          menuId: "-2",
          title: "工作台",
          icon: "koi-work",
          isVisible: "1",
          linkUrl: "",
          isKeepAlive: "1",
          isTag: "0",
          isAffix: "1"
        }
      }
    ]
  }
];

export const errorRouter: RouteRecordRaw[] = [
  {
    path: "/403",
    name: "403",
    component: () => import("@/views/error/403.vue"),
    meta: { title: "无权访问", isVisible: "0" }
  },
  {
    path: "/404",
    name: "404",
    component: () => import("@/views/error/404.vue"),
    meta: { title: "页面不存在", isVisible: "0" }
  },
  {
    path: "/500",
    name: "500",
    component: () => import("@/views/error/500.vue"),
    meta: { title: "服务异常", isVisible: "0" }
  },
  {
    path: "/:pathMatch(.*)*",
    component: () => import("@/views/error/404.vue")
  }
];
