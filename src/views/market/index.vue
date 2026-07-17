<template>
  <main class="market-page">
    <MarketHeader />

    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow"><i aria-hidden="true"></i>{{ t("market.home.badge") }}</span>
        <h1>{{ t("market.home.title") }}</h1>
        <p>{{ t("market.home.subtitle") }}</p>
        <a class="hero-link" href="#plugins">{{ t("market.home.discover") }} <span aria-hidden="true">↓</span></a>
      </div>
      <div class="trust-panel" aria-label="Plugin platform capabilities">
        <div class="trust-item">
          <span class="trust-icon">✓</span>
          <div><strong>{{ t("market.home.signatureTitle") }}</strong><small>{{ t("market.home.signatureText") }}</small></div>
        </div>
        <div class="trust-item">
          <span class="trust-icon">N</span>
          <div><strong>{{ t("market.home.nativeTitle") }}</strong><small>{{ t("market.home.nativeText") }}</small></div>
        </div>
        <div class="trust-item">
          <span class="trust-icon">↻</span>
          <div><strong>{{ t("market.home.updateTitle") }}</strong><small>{{ t("market.home.updateText") }}</small></div>
        </div>
      </div>
    </section>

    <section id="plugins" class="market-content">
      <form class="filters" role="search" @submit.prevent="load">
        <el-input v-model="search" clearable :placeholder="t('market.home.searchPlaceholder')" size="large" />
        <el-select v-model="category" :placeholder="t('market.home.allCategories')" clearable size="large" @change="load">
          <el-option v-for="item in categories" :key="item.id" :label="categoryLabel(item)" :value="item.id" />
        </el-select>
        <el-button native-type="submit" type="primary" size="large" :loading="loading">{{ t("market.home.search") }}</el-button>
      </form>

      <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" />

      <div class="catalog-layout">
        <aside class="category-panel">
          <h2>{{ t("market.home.categories") }}</h2>
          <button type="button" :class="{ active: !category }" @click="selectCategory('')">
            <span>{{ t("market.home.all") }}</span><b>{{ plugins.length }}</b>
          </button>
          <button v-for="item in categories" :key="item.id" type="button" :class="{ active: category === item.id }" @click="selectCategory(item.id)">
            <span>{{ categoryLabel(item) }}</span><i aria-hidden="true">›</i>
          </button>
        </aside>

        <section class="results" v-loading="loading">
          <div class="results-heading">
            <h2>{{ categoryTitle }}</h2>
            <span>{{ t("market.home.resultCount", { count: plugins.length }) }}</span>
          </div>
          <div class="plugin-grid">
            <router-link
              v-for="plugin in plugins"
              :key="plugin.pluginId"
              :to="`/market/plugins/${encodeURIComponent(plugin.pluginId)}`"
              class="plugin-card"
            >
              <div class="plugin-card-top">
                <span class="plugin-icon">{{ pluginInitial(plugin.name) }}</span>
                <span class="price">{{ plugin.pricingModel === "free" ? t("market.home.free") : money(plugin.priceCents) }}</span>
              </div>
              <div class="plugin-category">{{ pluginCategory(plugin.category) }}</div>
              <h3>{{ plugin.name }}</h3>
              <p>{{ plugin.summary || t("market.home.noSummary") }}</p>
              <div class="plugin-tags">
                <span v-for="tag in plugin.tags.slice(0, 3)" :key="tag">{{ tag }}</span>
              </div>
              <div class="plugin-footer">
                <div>
                  <small>{{ plugin.pluginId }}</small>
                  <b v-if="plugin.latestVersion">{{ t("market.home.version", { version: plugin.latestVersion }) }}</b>
                </div>
                <span class="open-arrow" :aria-label="t('market.home.details')">→</span>
              </div>
            </router-link>
          </div>
          <div v-if="!loading && plugins.length === 0" class="empty-state">
            <span aria-hidden="true">⌕</span>
            <h3>{{ t("market.home.emptyTitle") }}</h3>
            <p>{{ t("market.home.emptyDescription") }}</p>
          </div>
        </section>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from "vue";
import { useI18n } from "vue-i18n";
import MarketHeader from "@/components/market/MarketHeader.vue";
import { pluginCenterApi, type MarketCategory, type MarketPlugin } from "@/api/pluginCenter";

const { t, te, locale } = useI18n();
const search = ref("");
const category = ref("");
const loading = ref(false);
const error = ref("");
const plugins = ref<MarketPlugin[]>([]);
const categories = ref<MarketCategory[]>([]);

const categoryLabel = (item: MarketCategory) => {
  const key = `market.categories.${item.id}`;
  return te(key) ? t(key) : item.name;
};
const pluginCategory = (id: string) => {
  const item = categories.value.find(value => value.id === id);
  const key = `market.categories.${id}`;
  return te(key) ? t(key) : item?.name ?? id;
};
const categoryTitle = computed(() => {
  if (!category.value) return t("market.home.all");
  const item = categories.value.find(value => value.id === category.value);
  return item ? categoryLabel(item) : category.value;
});
const money = (cents: number) => new Intl.NumberFormat(locale.value === "zh" ? "zh-CN" : "en-US", {
  style: "currency",
  currency: "CNY"
}).format(cents / 100);
const pluginInitial = (name: string) => Array.from(name.trim())[0]?.toUpperCase() ?? "N";

const load = async () => {
  loading.value = true;
  error.value = "";
  try {
    plugins.value = await pluginCenterApi.listMarketPlugins({ search: search.value, category: category.value, take: 100 });
  } catch (e) {
    error.value = e instanceof Error && !(e instanceof TypeError) ? e.message : t("market.home.loadFailed");
  } finally {
    loading.value = false;
  }
};
const selectCategory = async (id: string) => {
  category.value = id;
  await load();
};

watchEffect(() => {
  document.title = t("project.title");
  document.documentElement.lang = locale.value === "zh" ? "zh-CN" : "en-US";
});
onMounted(async () => {
  try {
    categories.value = await pluginCenterApi.listCategories();
  } catch {
    // The plugin query below owns the user-visible loading error.
  }
  await load();
});
</script>

<style scoped lang="scss">
.market-page {
  --market-bg: #f5f7fb;
  --market-surface: rgba(255, 255, 255, .88);
  --market-surface-solid: #fff;
  --market-surface-soft: rgba(77, 91, 132, .07);
  --market-border: rgba(45, 56, 91, .12);
  --market-text: #192034;
  --market-muted: #677087;
  --market-accent: #5870f4;
  --market-accent-soft: rgba(88, 112, 244, .11);
  min-height: 100vh;
  color: var(--market-text);
  background:
    radial-gradient(circle at 88% -8%, rgba(111, 92, 255, .15), transparent 28rem),
    radial-gradient(circle at 8% 23%, rgba(64, 162, 255, .1), transparent 24rem),
    var(--market-bg);
}
:global(html.dark) .market-page {
  --market-bg: #0f1118;
  --market-surface: rgba(24, 27, 38, .9);
  --market-surface-solid: #181b26;
  --market-surface-soft: rgba(255, 255, 255, .055);
  --market-border: rgba(214, 220, 255, .11);
  --market-text: #f1f3fa;
  --market-muted: #a2a9bd;
  --market-accent: #7d8fff;
  --market-accent-soft: rgba(125, 143, 255, .13);
}

.hero {
  width: min(1180px, calc(100% - 40px));
  margin: 38px auto 54px;
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, .65fr);
  gap: 34px;
  align-items: center;
}
.hero-copy { padding: 44px 0 42px; }
.eyebrow { display: inline-flex; align-items: center; gap: 9px; color: var(--market-accent); font-size: 13px; font-weight: 750; }
.eyebrow i { width: 8px; height: 8px; border-radius: 50%; background: #38c889; box-shadow: 0 0 0 5px rgba(56, 200, 137, .12); }
.hero h1 { max-width: 720px; margin: 17px 0 18px; font-size: clamp(42px, 5.5vw, 72px); line-height: 1.04; letter-spacing: -.055em; }
.hero p { max-width: 700px; margin: 0; color: var(--market-muted); font-size: 17px; line-height: 1.8; }
.hero-link { display: inline-flex; align-items: center; gap: 8px; margin-top: 25px; color: var(--market-accent); font-size: 14px; font-weight: 700; }
.trust-panel { padding: 14px; border: 1px solid var(--market-border); border-radius: 20px; background: var(--market-surface); box-shadow: 0 24px 70px rgba(32, 42, 80, .1); backdrop-filter: blur(18px); }
.trust-item { display: flex; align-items: center; gap: 13px; padding: 15px; border-radius: 13px; }
.trust-item + .trust-item { border-top: 1px solid var(--market-border); border-radius: 0; }
.trust-icon { width: 36px; height: 36px; flex: 0 0 auto; display: grid; place-items: center; border-radius: 11px; color: var(--market-accent); background: var(--market-accent-soft); font-weight: 900; }
.trust-item div { display: grid; gap: 4px; }
.trust-item strong { font-size: 14px; }
.trust-item small { color: var(--market-muted); font-size: 12px; line-height: 1.45; }

.market-content { width: min(1180px, calc(100% - 40px)); margin: 0 auto; padding-bottom: 70px; scroll-margin-top: 20px; }
.filters { display: grid; grid-template-columns: minmax(240px, 1fr) 220px auto; gap: 10px; padding: 12px; border: 1px solid var(--market-border); border-radius: 16px; background: var(--market-surface); box-shadow: 0 14px 38px rgba(31, 42, 78, .07); }
.filters :deep(.el-input__wrapper), .filters :deep(.el-select__wrapper) { border-radius: 10px; box-shadow: none; background: var(--market-surface-soft); }
.filters :deep(.el-button) { min-width: 96px; border-radius: 10px; }
.catalog-layout { display: grid; grid-template-columns: 210px minmax(0, 1fr); gap: 30px; margin-top: 34px; }
.category-panel { align-self: start; position: sticky; top: 20px; }
.category-panel h2 { margin: 0 0 12px 10px; color: var(--market-muted); font-size: 11px; text-transform: uppercase; letter-spacing: .13em; }
.category-panel button { width: 100%; min-height: 42px; padding: 0 12px; display: flex; align-items: center; justify-content: space-between; border: 0; border-radius: 10px; color: var(--market-muted); background: transparent; font: inherit; font-size: 13px; cursor: pointer; }
.category-panel button:hover { color: var(--market-text); background: var(--market-surface-soft); }
.category-panel button.active { color: var(--market-accent); background: var(--market-accent-soft); font-weight: 700; }
.category-panel b { min-width: 24px; padding: 2px 6px; border-radius: 99px; background: var(--market-surface-soft); font-size: 10px; }
.category-panel i { font-size: 18px; font-style: normal; }
.results { min-height: 300px; }
.results-heading { margin-bottom: 15px; display: flex; align-items: end; justify-content: space-between; gap: 20px; }
.results-heading h2 { margin: 0; font-size: 22px; letter-spacing: -.02em; }
.results-heading span { color: var(--market-muted); font-size: 12px; }
.plugin-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.plugin-card { min-height: 312px; padding: 20px; display: flex; flex-direction: column; border: 1px solid var(--market-border); border-radius: 17px; color: var(--market-text); background: var(--market-surface); box-shadow: 0 9px 24px rgba(30, 41, 78, .045); transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease; }
.plugin-card:hover { transform: translateY(-3px); border-color: rgba(88, 112, 244, .38); box-shadow: 0 18px 36px rgba(42, 52, 95, .12); }
.plugin-card-top { display: flex; align-items: start; justify-content: space-between; gap: 16px; }
.plugin-icon { width: 48px; height: 48px; display: grid; place-items: center; border-radius: 14px; color: #fff; background: linear-gradient(145deg, #667cff, #8a54ee); box-shadow: 0 10px 25px rgba(100, 91, 238, .22); font-size: 20px; font-weight: 800; }
.price { padding: 5px 9px; border-radius: 8px; color: var(--market-accent); background: var(--market-accent-soft); font-size: 12px; font-weight: 750; }
.plugin-category { margin-top: 20px; color: var(--market-accent); font-size: 11px; font-weight: 750; letter-spacing: .04em; }
.plugin-card h3 { margin: 7px 0 8px; font-size: 20px; letter-spacing: -.02em; }
.plugin-card > p { min-height: 64px; margin: 0; color: var(--market-muted); font-size: 13px; line-height: 1.65; }
.plugin-tags { min-height: 28px; margin-top: 14px; display: flex; flex-wrap: wrap; gap: 5px; }
.plugin-tags span { padding: 4px 7px; border: 1px solid var(--market-border); border-radius: 7px; color: var(--market-muted); font-size: 10px; }
.plugin-footer { margin-top: auto; padding-top: 17px; display: flex; align-items: end; justify-content: space-between; gap: 12px; border-top: 1px solid var(--market-border); }
.plugin-footer div { min-width: 0; display: grid; gap: 4px; }
.plugin-footer small { overflow: hidden; color: var(--market-muted); font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.plugin-footer b { font-size: 11px; font-weight: 650; }
.open-arrow { width: 30px; height: 30px; flex: 0 0 auto; display: grid; place-items: center; border-radius: 9px; color: var(--market-accent); background: var(--market-accent-soft); }
.empty-state { padding: 64px 24px; text-align: center; border: 1px dashed var(--market-border); border-radius: 17px; }
.empty-state > span { color: var(--market-accent); font-size: 42px; }
.empty-state h3 { margin: 12px 0 4px; }
.empty-state p { margin: 0; color: var(--market-muted); }

@media (max-width: 900px) {
  .hero { grid-template-columns: 1fr; margin-top: 20px; }
  .hero-copy { padding-bottom: 0; }
  .trust-panel { display: grid; grid-template-columns: repeat(3, 1fr); }
  .trust-item { align-items: flex-start; }
  .trust-item + .trust-item { border-top: 0; border-left: 1px solid var(--market-border); border-radius: 0; }
  .catalog-layout { grid-template-columns: 1fr; }
  .category-panel { position: static; display: flex; overflow-x: auto; gap: 6px; }
  .category-panel h2 { display: none; }
  .category-panel button { width: auto; flex: 0 0 auto; padding: 0 14px; }
}
@media (max-width: 700px) {
  .hero, .market-content { width: min(100% - 28px, 1180px); }
  .hero { margin-bottom: 38px; gap: 22px; }
  .hero-copy { padding-top: 28px; }
  .hero h1 { font-size: clamp(38px, 12vw, 54px); }
  .hero p { font-size: 15px; }
  .trust-panel { grid-template-columns: 1fr; }
  .trust-item + .trust-item { border-left: 0; border-top: 1px solid var(--market-border); }
  .filters { grid-template-columns: 1fr; }
  .plugin-grid { grid-template-columns: 1fr; }
}
</style>
