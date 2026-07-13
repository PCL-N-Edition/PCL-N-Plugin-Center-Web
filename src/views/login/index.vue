<template>
  <main class="login-page">
    <section class="login-hero">
      <div class="hero-orb hero-orb-one"></div>
      <div class="hero-orb hero-orb-two"></div>
      <div class="hero-content">
        <el-tag effect="dark" round>PCL.N Plugin Platform</el-tag>
        <h1>让插件发布、审核与分发<br />进入同一条可信链路</h1>
        <p>发布者工作台与平台管理端共用统一身份、审计记录和安全扫描结果。</p>
        <div class="feature-grid">
          <div><strong>Supabase Auth</strong><span>GitHub OAuth 单点登录</span></div>
          <div><strong>RLS</strong><span>发布者与管理员数据隔离</span></div>
          <div><strong>.pnp Scanner</strong><span>独立进程执行包安全检查</span></div>
        </div>
      </div>
    </section>

    <section class="login-panel">
      <div class="login-card">
        <div class="brand-mark">P</div>
        <h2>PCL.N 插件中心</h2>
        <p class="login-copy">使用 GitHub 身份进入发布者工作台。管理员权限由数据库成员关系单独授予。</p>
        <el-alert
          v-if="errorMessage"
          :title="errorMessage"
          type="error"
          show-icon
          :closable="false"
          class="login-alert"
        />
        <el-button type="primary" size="large" :loading="loading" class="github-button" @click="signIn">
          <span class="github-icon">GH</span>
          使用 GitHub 登录
        </el-button>
        <div class="security-note">
          <el-icon><Lock /></el-icon>
          <span>前端仅使用 Supabase Publishable Key；管理写入由受保护 API 完成。</span>
        </div>
        <a href="https://github.com/MuXue1230-owo/PCL-N-Plugin-Center-Web" target="_blank" rel="noreferrer">
          查看开源管理端
        </a>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Lock } from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
import { HOME_URL } from "@/config";
import { supabase } from "@/lib/supabase";
import useUserStore from "@/stores/modules/user";

const router = useRouter();
const userStore = useUserStore();
const loading = ref(false);
const errorMessage = ref("");

onMounted(async () => {
  try {
    await userStore.restoreSession(true);
    if (userStore.token) await router.replace(HOME_URL);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "无法恢复登录会话";
  }
});

const signIn = async () => {
  loading.value = true;
  errorMessage.value = "";
  const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin).toString();
  const redirectTo = import.meta.env.VITE_ROUTER_MODE === "hash" ? `${baseUrl}#/login` : new URL("login", baseUrl).toString();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo }
  });
  if (error) {
    errorMessage.value = error.message;
    loading.value = false;
  }
};
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(380px, 0.65fr);
  background: var(--el-bg-color-page);
}

.login-hero {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: clamp(48px, 8vw, 120px);
  color: white;
  background: linear-gradient(145deg, #16245d 0%, #334bc2 52%, #6b7ff5 100%);
}

.hero-content { position: relative; z-index: 2; max-width: 760px; }
.hero-content h1 { margin: 28px 0 20px; font-size: clamp(40px, 4.2vw, 64px); line-height: 1.13; letter-spacing: -0.04em; }
.hero-content > p { max-width: 640px; font-size: 18px; line-height: 1.8; color: rgba(255, 255, 255, 0.78); }
.hero-orb { position: absolute; border-radius: 999px; filter: blur(2px); background: rgba(255,255,255,.12); }
.hero-orb-one { width: 440px; height: 440px; right: -140px; top: -100px; }
.hero-orb-two { width: 260px; height: 260px; left: 15%; bottom: -160px; }

.feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 48px; }
.feature-grid div { padding: 20px; border: 1px solid rgba(255,255,255,.18); border-radius: 16px; background: rgba(255,255,255,.08); backdrop-filter: blur(12px); }
.feature-grid strong, .feature-grid span { display: block; }
.feature-grid span { margin-top: 8px; font-size: 13px; color: rgba(255,255,255,.7); }

.login-panel { display: flex; align-items: center; justify-content: center; padding: 48px; }
.login-card { width: min(420px, 100%); text-align: center; }
.brand-mark { display: inline-grid; place-items: center; width: 56px; height: 56px; border-radius: 18px; color: white; font-size: 28px; font-weight: 800; background: linear-gradient(145deg, #334bc2, #6b7ff5); box-shadow: 0 18px 36px rgba(51,75,194,.25); }
.login-card h2 { margin: 24px 0 12px; font-size: 28px; }
.login-copy { margin: 0 0 28px; line-height: 1.75; color: var(--el-text-color-secondary); }
.login-alert { margin-bottom: 18px; text-align: left; }
.github-button { width: 100%; height: 48px; font-weight: 600; }
.github-icon { display: inline-grid; place-items: center; width: 24px; height: 24px; margin-right: 8px; border-radius: 50%; font-size: 10px; background: rgba(255,255,255,.18); }
.security-note { display: flex; gap: 8px; align-items: flex-start; margin: 20px 0; padding: 14px; border-radius: 12px; text-align: left; font-size: 12px; line-height: 1.6; color: var(--el-text-color-secondary); background: var(--el-fill-color-light); }
.login-card a { color: var(--el-color-primary); font-size: 13px; }

@media (max-width: 980px) {
  .login-page { grid-template-columns: 1fr; }
  .login-hero { min-height: 420px; padding: 48px 28px; }
  .feature-grid { grid-template-columns: 1fr; }
  .login-panel { padding: 48px 28px; }
}
</style>
