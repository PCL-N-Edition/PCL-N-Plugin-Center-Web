<template>
  <main class="login-page">
    <section class="login-hero">
      <div class="hero-orb hero-orb-one"></div>
      <div class="hero-orb hero-orb-two"></div>
      <div class="hero-content">
        <el-tag effect="dark" round>{{ t("login.badge") }}</el-tag>
        <h1 v-html="t('login.heroTitle')"></h1>
        <p>{{ t("login.heroSubtitle") }}</p>
        <div class="feature-grid">
          <div><strong>Supabase Auth</strong><span>{{ t("login.featureAuth") }}</span></div>
          <div><strong>RLS</strong><span>{{ t("login.featureRls") }}</span></div>
          <div><strong>.pnp Scanner</strong><span>{{ t("login.featureScanner") }}</span></div>
        </div>
      </div>
    </section>

    <section class="login-panel">
      <div class="login-toolbar">
        <button class="toolbar-btn" type="button" :aria-label="t('market.header.switchTheme')" @click="cycleTheme">
          <span aria-hidden="true">{{ themeIcon }}</span>
        </button>
        <button class="toolbar-btn" type="button" :aria-label="t('market.header.switchLanguage')" @click="toggleLanguage">
          {{ locale === "zh" ? "EN" : "中文" }}
        </button>
      </div>
      <div class="login-card">
        <div class="brand-mark">P</div>
        <h2>{{ t("login.title") }}</h2>
        <p class="login-copy">{{ t("login.copy") }}</p>
        <el-alert
          v-if="errorMessage"
          :title="errorMessage"
          type="error"
          show-icon
          :closable="false"
          class="login-alert"
        />
        <div class="legal-block">
          <el-checkbox v-model="acceptedLegal">
            {{ t("login.legalPrefix") }}
            <a :href="legalUrls.terms" target="_blank" rel="noreferrer" @click.stop>{{ t("login.terms") }}</a>
            {{ t("login.and") }}
            <a :href="legalUrls.privacy" target="_blank" rel="noreferrer" @click.stop>{{ t("login.privacy") }}</a>
          </el-checkbox>
          <p class="legal-hint">{{ t("login.legalHint", { version: legalVersion }) }}</p>
        </div>
        <el-button
          type="primary"
          size="large"
          :loading="loadingProvider==='github'"
          :disabled="!acceptedLegal"
          class="oauth-button"
          @click="signIn('github')"
        >
          <span class="github-icon">GH</span>{{ t("login.github") }}
        </el-button>
        <el-button
          size="large"
          :loading="loadingProvider==='azure'"
          :disabled="!acceptedLegal"
          class="oauth-button microsoft"
          @click="signIn('azure')"
        >
          <span class="microsoft-icon">M</span>{{ t("login.microsoft") }}
        </el-button>
        <div class="security-note">
          <el-icon><Lock /></el-icon>
          <span>{{ t("login.securityNote") }}</span>
        </div>
        <div class="login-links">
          <a href="https://pcln.top/market/">{{ t("login.market") }}</a>
          <a href="https://docs.pcln.top/" target="_blank" rel="noreferrer">{{ t("login.docs") }}</a>
          <a href="https://github.com/PCL-N-Edition/PCL-N-Plugin-Center-Web" target="_blank" rel="noreferrer">
            {{ t("login.opensource") }}
          </a>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Lock } from "@element-plus/icons-vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { HOME_URL } from "@/config";
import { supabase } from "@/lib/supabase";
import useGlobalStore from "@/stores/modules/global";
import useUserStore from "@/stores/modules/user";
import {
  NCLOUD_LEGAL_VERSION,
  acceptNCloudLegal,
  hasAcceptedNCloudLegal,
  legalDocumentUrls
} from "@/utils/legal";
import {
  buildOAuthRedirectTo,
  handoffSessionToStore,
  isAuthHost,
  isLocalAuthHost
} from "@/utils/authHosts";
import {
  applyPublicTheme,
  cyclePublicThemeMode,
  readPublicThemeMode,
  writePublicThemeMode,
  type PublicThemeMode
} from "@/utils/publicTheme";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const globalStore = useGlobalStore();
const { t, locale } = useI18n();
const loadingProvider = ref<"github" | "azure" | "">("");
const errorMessage = ref("");
const acceptedLegal = ref(hasAcceptedNCloudLegal());
const legalVersion = NCLOUD_LEGAL_VERSION;
const legalUrls = legalDocumentUrls;
const themeMode = ref<PublicThemeMode>(readPublicThemeMode());
const themeIcon = computed(() =>
  themeMode.value === "system" ? "◐" : themeMode.value === "dark" ? "☾" : "☀"
);

applyPublicTheme(themeMode.value);

const cycleTheme = () => {
  themeMode.value = cyclePublicThemeMode(themeMode.value);
  writePublicThemeMode(themeMode.value);
  applyPublicTheme(themeMode.value);
};

const toggleLanguage = () => {
  const next = locale.value === "zh" ? "en" : "zh";
  locale.value = next;
  globalStore.setGlobalState("language", next);
  document.documentElement.lang = next === "zh" ? "zh-CN" : "en-US";
};

const resolvePostLoginRedirect = () => {
  const storedRedirect = sessionStorage.getItem("pcln-login-redirect");
  return typeof route.query.redirect === "string" && route.query.redirect.startsWith("/")
    ? route.query.redirect
    : storedRedirect?.startsWith("/")
      ? storedRedirect
      : HOME_URL;
};

onMounted(async () => {
  applyPublicTheme(themeMode.value);
  const storedOAuthError = sessionStorage.getItem("pcln-oauth-error");
  if (route.query.oauthError === "1" && storedOAuthError) {
    sessionStorage.removeItem("pcln-oauth-error");
    errorMessage.value = `${t("login.microsoft")}: ${storedOAuthError}`;
    return;
  }
  const oauthError = String(route.query.error_description ?? route.query.error ?? "");
  if (/email|identity|already|registered|exists/i.test(oauthError)) {
    try {
      await ElMessageBox.confirm(
        t("login.accountExistsBody"),
        t("login.accountExistsTitle"),
        {
          confirmButtonText: t("login.accountExistsConfirm"),
          cancelButtonText: t("login.cancel"),
          type: "warning"
        }
      );
      const attemptedProvider = sessionStorage.getItem("pcln-attempted-provider");
      if (attemptedProvider) sessionStorage.setItem("pcln-pending-link-provider", attemptedProvider);
      await supabase.auth.signOut();
      errorMessage.value = t("login.useOriginalAccount");
      return;
    } catch {
      errorMessage.value = t("login.noDuplicateAccount");
      return;
    }
  }
  try {
    await userStore.restoreSession(true);
    if (userStore.token) {
      const redirect = resolvePostLoginRedirect();
      sessionStorage.removeItem("pcln-login-redirect");
      // Production: login UI lives on auth; hand session to pcln.top.
      if (isAuthHost() && !isLocalAuthHost()) {
        await handoffSessionToStore(redirect);
        return;
      }
      await router.replace(redirect);
      return;
    }
    const oauthProvider = route.query.provider;
    if (oauthProvider === "github" || oauthProvider === "azure") {
      if (!acceptedLegal.value) {
        errorMessage.value = t("login.acceptLegalFirst");
        return;
      }
      await signIn(oauthProvider);
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t("login.restoreFailed");
  }
});

const signIn = async (provider: "github" | "azure") => {
  if (!acceptedLegal.value) {
    ElMessage.warning(t("login.acceptLegalWarn"));
    return;
  }
  // Record acceptance at registration/login intent so OAuth callback is not blocked.
  acceptNCloudLegal();
  loadingProvider.value = provider;
  sessionStorage.setItem("pcln-attempted-provider", provider);
  sessionStorage.setItem("pcln-current-oauth-provider", provider);
  errorMessage.value = "";
  const target = typeof route.query.redirect === "string" && route.query.redirect.startsWith("/")
    ? route.query.redirect
    : "/market";

  // PKCE: start + callback must be same origin → auth.pcln.top/login in production.
  const redirectTo = buildOAuthRedirectTo(target);
  sessionStorage.setItem("pcln-login-redirect", target);
  // Microsoft: request standard OIDC claims only for login.
  // XboxLive.signin often breaks code exchange (Unable to exchange external code: M.C…)
  // unless the Azure app is fully configured for Xbox Live; request it only when
  // the post-login target is desktop pairing / explicit xbox=1.
  const wantsXbox =
    provider === "azure" &&
    (route.query.xbox === "1" ||
      target.includes("/desktop/authorize") ||
      target.includes("/account/authorize"));
  const azureScopes = wantsXbox
    ? "openid profile email offline_access XboxLive.signin"
    : "openid profile email offline_access";
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      scopes: provider === "azure" ? azureScopes : undefined
    }
  });
  if (error) {
    errorMessage.value = error.message;
    loadingProvider.value = "";
  }
};
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(380px, 0.65fr);
  background: var(--el-bg-color-page);
  color: var(--el-text-color-primary);
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

:global(html.dark .login-hero) {
  background: linear-gradient(145deg, #0b1024 0%, #1a2a6c 48%, #3d4fad 100%);
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

.login-panel {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  background: var(--el-bg-color-page);
}
.login-toolbar {
  position: absolute;
  top: 18px;
  right: 18px;
  display: flex;
  gap: 8px;
}
.toolbar-btn {
  min-width: 36px;
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 9px;
  color: var(--el-text-color-primary);
  background: var(--el-bg-color);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
.toolbar-btn:hover {
  background: var(--el-fill-color-light);
}
.login-card { width: min(420px, 100%); text-align: center; }
.brand-mark { display: inline-grid; place-items: center; width: 56px; height: 56px; border-radius: 18px; color: white; font-size: 28px; font-weight: 800; background: linear-gradient(145deg, #334bc2, #6b7ff5); box-shadow: 0 18px 36px rgba(51,75,194,.25); }
.login-card h2 { margin: 24px 0 12px; font-size: 28px; color: var(--el-text-color-primary); }
.login-copy { margin: 0 0 28px; line-height: 1.75; color: var(--el-text-color-secondary); }
.login-alert { margin-bottom: 18px; text-align: left; }
.legal-block {
  margin: 0 0 18px;
  padding: 14px 16px;
  border-radius: 12px;
  text-align: left;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
}
.legal-block :deep(.el-checkbox) {
  height: auto;
  align-items: flex-start;
  white-space: normal;
  color: var(--el-text-color-primary);
}
.legal-block a {
  color: var(--el-color-primary);
  font-weight: 600;
}
.legal-hint {
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}
.oauth-button { width: 100%; height: 48px; font-weight: 600; margin: 0 0 12px; }
.microsoft { color: #fff; border-color: #1769aa; background: #1769aa; }
.microsoft:hover { color: #fff; border-color: #1a78c2; background: #1a78c2; }
.microsoft-icon, .github-icon { display: inline-grid; place-items: center; width: 24px; height: 24px; margin-right: 8px; border-radius: 50%; font-size: 10px; background: rgba(255,255,255,.18); }
.security-note { display: flex; gap: 8px; align-items: flex-start; margin: 20px 0; padding: 14px; border-radius: 12px; text-align: left; font-size: 12px; line-height: 1.6; color: var(--el-text-color-secondary); background: var(--el-fill-color-light); border: 1px solid var(--el-border-color-lighter); }
.login-card a { color: var(--el-color-primary); font-size: 13px; }
.login-links { display: flex; justify-content: center; flex-wrap: wrap; gap: 10px 18px; }

@media (max-width: 980px) {
  .login-page { grid-template-columns: 1fr; }
  .login-hero { min-height: 420px; padding: 48px 28px; }
  .feature-grid { grid-template-columns: 1fr; }
  .login-panel { padding: 48px 28px; }
}
</style>
