<template>
  <header class="market-header">
    <router-link to="/market" class="brand" aria-label="PCL N Plugin Center">
      <span class="brand-mark">N</span>
      <span class="brand-copy">
        <strong>{{ t("market.header.brand") }}</strong>
        <small>PLUGIN PLATFORM</small>
      </span>
    </router-link>
    <nav aria-label="Market navigation">
      <a href="https://docs.pcln.top/" target="_blank" rel="noreferrer">{{ t("market.header.docs") }}</a>
      <router-link v-if="userStore.token" to="/home">{{ t("market.header.dashboard") }}</router-link>
      <a v-else :href="authHref">{{ t("market.header.signIn") }}</a>
      <button class="language-button" type="button" :aria-label="t('market.header.switchLanguage')" @click="toggleLanguage">
        <span aria-hidden="true">文</span>
        {{ locale === "zh" ? "EN" : "中文" }}
      </button>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import useGlobalStore from "@/stores/modules/global";
import useUserStore from "@/stores/modules/user";

const route = useRoute();
const userStore = useUserStore();
const globalStore = useGlobalStore();
const { t, locale } = useI18n();
const authHref = computed(() => `https://auth.pcln.top/#/login?redirect=${encodeURIComponent(route.path)}`);

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
  width: 36px; height: 36px; display: grid; place-items: center; border-radius: 10px;
  color: #fff; font-size: 18px; font-weight: 900; letter-spacing: -.04em;
  background: linear-gradient(145deg, #5f7cff, #7c4dff);
  box-shadow: 0 8px 24px rgba(86, 101, 255, .28);
}
.brand-copy { display: grid; line-height: 1.05; }
.brand-copy strong { font-size: 15px; font-weight: 750; }
.brand-copy small { margin-top: 5px; color: var(--market-muted); font-size: 8px; font-weight: 800; letter-spacing: .18em; }
nav { display: flex; align-items: center; gap: 8px; }
nav a, .language-button {
  min-height: 36px; padding: 0 12px; display: inline-flex; align-items: center; gap: 7px;
  border: 0; border-radius: 9px; color: var(--market-muted); background: transparent;
  font: inherit; font-size: 13px; cursor: pointer; transition: color .18s ease, background .18s ease;
}
nav a:hover, .language-button:hover { color: var(--market-text); background: var(--market-surface-soft); }
.language-button { border: 1px solid var(--market-border); color: var(--market-text); }

@media (max-width: 720px) {
  .market-header { width: min(100% - 28px, 1180px); height: 66px; }
  .brand-copy small, nav a:first-child { display: none; }
  nav { gap: 2px; }
  nav a, .language-button { padding: 0 9px; }
}
</style>
