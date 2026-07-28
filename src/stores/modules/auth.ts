import { defineStore } from "pinia";
import { staticRouter } from "@/routers/modules/staticRouter";
import authMenu from "@/assets/json/authMenu.json";
import { generateRoutes, generateFlattenRoutes } from "@/utils/filterRoute.ts";
import { getShowStaticAndDynamicMenuList, getAllBreadcrumbList } from "@/utils/index.ts";
import { supabase } from "@/lib/supabase";

/** Immutable platform super admin — only this account manages administrators. */
const PLATFORM_SUPER_ADMIN_USER_ID = "ebdb905b-0309-4deb-a8d6-9c9fbc7081ca";

const authStore = defineStore("auth", {
  state: (): any => ({
    menuList: [],
    recursiveMenuList: [],
    breadcrumbList: [],
    roleList: [],
    buttonList: [],
    isAdmin: false,
    isSuperAdmin: false,
    loginUser: {
      userId: "",
      loginName: "",
      email: "",
      avatar: ""
    }
  }),
  actions: {
    async resolveIdentity() {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) throw error ?? new Error("Supabase session is unavailable.");

      const user = data.user;
      const isSuperAdmin = user.id.toLowerCase() === PLATFORM_SUPER_ADMIN_USER_ID;
      const { data: adminMembership, error: adminError } = await supabase
        .from("plugin_center_admin_members")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      if (adminError) throw adminError;

      // Super admin is always admin, even if membership row is briefly missing.
      this.isSuperAdmin = isSuperAdmin;
      this.isAdmin = Boolean(adminMembership) || isSuperAdmin;
      const role = isSuperAdmin ? "admin" : adminMembership?.role;
      this.roleList = this.isAdmin && role ? ["publisher", role] : ["publisher"];
      this.buttonList = [];
      this.loginUser = {
        userId: user.id,
        loginName: user.user_metadata?.user_name ?? user.user_metadata?.name ?? user.email ?? "PCL.N 用户",
        email: user.email ?? "",
        avatar: user.user_metadata?.avatar_url ?? ""
      };
    },
    async listRouters() {
      await this.resolveIdentity();
      const visibleMenu = (authMenu.data as any[]).filter(
        item => item.workspace !== "admin" || this.isAdmin
      );
      this.menuList = generateFlattenRoutes(visibleMenu);
      this.recursiveMenuList = getShowStaticAndDynamicMenuList(staticRouter).concat(
        generateRoutes(getShowStaticAndDynamicMenuList(visibleMenu), 0)
      );
      this.breadcrumbList = staticRouter.concat(generateRoutes(visibleMenu, 0));
    },
    async getLoginUserInfo() {
      if (!this.loginUser.userId) await this.resolveIdentity();
    }
  },
  getters: {
    getButtonList: state => state.buttonList,
    getMenuList: state => state.menuList,
    showMenuList: state => state.recursiveMenuList,
    getBreadcrumbList: state => getAllBreadcrumbList(state.breadcrumbList)
  }
});

export default authStore;
