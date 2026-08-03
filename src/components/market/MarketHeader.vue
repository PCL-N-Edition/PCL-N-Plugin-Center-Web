<template>
  <header class="market-header">
    <router-link to="/" class="brand" aria-label="PCL N">
      <img class="brand-mark" src="/pcln.png" alt="" />
      <span class="brand-copy">
        <strong>{{ t("market.header.brand") }}</strong>
        <small>PLUGIN PLATFORM</small>
      </span>
    </router-link>
    <nav :aria-label="t('market.header.navigation')">
      <router-link to="/">{{ t("market.header.home") }}</router-link>
      <router-link to="/market">{{ t("market.header.plugins") }}</router-link>
      <router-link to="/download">{{ t("market.header.download") }}</router-link>
      <a class="docs-link" href="https://docs.pcln.top/" target="_blank" rel="noreferrer">{{ t("market.header.docs") }}</a>
      <router-link v-if="userStore.token" to="/home">{{ t("market.header.dashboard") }}</router-link>
      <a v-else :href="authHref">{{ t("market.header.signIn") }}</a>
      <button class="theme-button" type="button" :aria-label="t('market.header.switchTheme')" @click="cycleTheme">
        <span aria-hidden="true">{{ themeIcon }}</span>
      </button>
      <button class="language-button" type="button" :aria-label="t('market.header.switchLanguage')" @click="toggleLanguage">
        <span aria-hidden="true">文</span>
        {{ locale === "zh" ? "EN" : "中文" }}
      </button>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import useGlobalStore from "@/stores/modules/global";
import useUserStore from "@/stores/modules/user";

const route = useRoute();
const userStore = useUserStore();
const globalStore = useGlobalStore();
const { t, locale } = useI18n();
// Login always lives on auth.pcln.top (history path; CF Pages SPA + static shells).
const authHref = computed(
  () => `https://auth.pcln.top/login/?redirect=${encodeURIComponent(route.fullPath || "/")}`
);
type ThemeMode = "system" | "light" | "dark";
const themeMode = ref<ThemeMode>((localStorage.getItem("pcln-market-theme") as ThemeMode) || "system");
const media = window.matchMedia("(prefers-color-scheme: dark)");
const themeIcon = computed(() => themeMode.value === "system" ? "◐" : themeMode.value === "dark" ? "☾" : "☀");
const applyMarketTheme = () => {
  const dark = themeMode.value === "dark" || (themeMode.value === "system" && media.matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
};
const cycleTheme = () => {
  themeMode.value = themeMode.value === "system" ? "light" : themeMode.value === "light" ? "dark" : "system";
  localStorage.setItem("pcln-market-theme", themeMode.value);
  applyMarketTheme();
};
onMounted(() => {
  applyMarketTheme();
  media.addEventListener("change", applyMarketTheme);
});
onBeforeUnmount(() => media.removeEventListener("change", applyMarketTheme));

const toggleLanguage = () => {
  const next = locale.value === "zh" ? "en" : "zh";
  locale.value = next;
  globalStore.setGlobalState("language", next);
  document.documentElement.lang = next === "zh" ? "zh-CN" : "en-US";
};
</script>

<style scoped lang="scss">
.market-header {
  width: min(1180px, calc(100% - 40px));
  height: 76px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.brand { display: inline-flex; align-items: center; gap: 11px; color: var(--market-text); }
.brand-mark {
  width: 36px; height: 36px; object-fit: contain; border-radius: 10px;
  box-shadow: 0 8px 24px rgba(86, 101, 255, .18);
}
.brand-copy { display: grid; line-height: 1.05; }
.brand-copy strong { font-size: 15px; font-weight: 750; }
.brand-copy small { margin-top: 5px; color: var(--market-muted); font-size: 8px; font-weight: 800; letter-spacing: .18em; }
nav { display: flex; align-items: center; gap: 8px; }
nav a, .language-button, .theme-button {
  min-height: 36px; padding: 0 12px; display: inline-flex; align-items: center; gap: 7px;
  border: 0; border-radius: 9px; color: var(--market-muted); background: transparent;
  font: inherit; font-size: 13px; cursor: pointer; transition: color .18s ease, background .18s ease;
}
nav a:hover, .language-button:hover, .theme-button:hover { color: var(--market-text); background: var(--market-surface-soft); }
nav a.router-link-exact-active { color: var(--market-accent); background: var(--market-accent-soft); font-weight: 700; }
.language-button, .theme-button { border: 1px solid var(--market-border); color: var(--market-text); }
.theme-button { width: 36px; padding: 0; justify-content: center; }

@media (max-width: 720px) {
  .market-header { width: min(100% - 28px, 1180px); height: 66px; }
  .brand-copy, .docs-link, nav > a:nth-of-type(2) { display: none; }
  nav { gap: 2px; }
  nav a, .language-button, .theme-button { padding: 0 9px; }
}
</style>
