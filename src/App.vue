<template>
  <el-config-provider :locale="locale" :size="dimension">
    <router-view></router-view>
  </el-config-provider>
</template>

<script setup lang="ts">
import { onMounted, nextTick, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { getBrowserLanguage, getDocumentLanguage, normalizeLanguage } from "@/languages/language.ts";
import { useTheme } from "@/utils/theme.ts";
import { applyPublicTheme } from "@/utils/publicTheme.ts";
import en from "element-plus/es/locale/lang/en";
import zhCn from "element-plus/es/locale/lang/zh-cn";
// import { autoRefresh } from "@/utils/autoUpdate.ts";

import useGlobalStore from "@/stores/modules/global.ts";
const globalStore = useGlobalStore();

const dimension = computed(() => globalStore.dimension);
const { initThemeConfig } = useTheme();

// 初始化语言
const i18n = useI18n();

// Public pages (market / login / callback) share pcln-market-theme; apply before first paint settles.
applyPublicTheme();

onMounted(() => {
  // 初始化主题配置
  handleThemeConfig();
  // 自动检测更新
  // handleAutoUpdate();
  // 开发环境打印项目名称
  console.log(
    `%c KOI-ADMIN %c V1.0.0 `,
    "padding: 2px 1px; border-radius: 3px 0 0 3px; color: #fff; background: #6169FF; font-weight: bold;",
    "padding: 2px 1px; border-radius: 0 3px 3px 0; color: #fff; background: #42c02e; font-weight: bold;"
  );
});

/** 语言配置 */
const locale = computed(() => {
  return globalStore.language === "zh" ? zhCn : en;
});

// Pinia is the single source of truth. This also repairs stale/invalid values
// from older persisted store versions before any page renders translated text.
watch(
  () => globalStore.language,
  (value) => {
    const language = normalizeLanguage(value, getBrowserLanguage());
    if (value !== language) {
      globalStore.setLanguage(language);
      return;
    }

    i18n.locale.value = language;
    document.documentElement.lang = getDocumentLanguage(language);
  },
  { immediate: true, flush: "sync" }
);

/** 初始化主题配置 */
const handleThemeConfig = () => {
  nextTick(() => {
    // Re-apply public theme so pinia isDark matches market/login preference.
    applyPublicTheme();
    initThemeConfig();
  });
};

/** 自动检测更新 */
// const handleAutoUpdate = () => {
//   nextTick(() => {
//     if (import.meta.env.VITE_ENV === "production") autoRefresh();
//   });
// };
</script>

<style scoped></style>
