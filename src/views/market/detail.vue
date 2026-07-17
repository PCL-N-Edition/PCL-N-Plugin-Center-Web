<template>
  <main class="detail-page">
    <MarketHeader />
    <div class="detail-shell">
      <router-link to="/market" class="back-link"><span aria-hidden="true">←</span>{{ t("market.detail.back") }}</router-link>

      <div v-if="loading" class="loading-card">
        <el-skeleton :rows="8" animated />
        <p>{{ t("market.detail.loading") }}</p>
      </div>
      <el-result v-else-if="error" icon="error" :title="t('market.detail.errorTitle')" :sub-title="error" />

      <article v-else-if="plugin">
        <section class="headline">
          <div class="identity">
            <div class="plugin-icon">{{ pluginInitial }}</div>
            <div>
              <span class="category">{{ categoryLabel(plugin.category) }}</span>
              <h1>{{ plugin.name }}</h1>
              <p>{{ plugin.summary || t("market.detail.noDescription") }}</p>
            </div>
          </div>
          <div class="purchase-card">
            <span class="purchase-label">{{ plugin.pricingModel === "free" ? t("market.detail.free") : money(plugin.priceCents) }}</span>
            <strong>{{ actionText }}</strong>
            <p>{{ purchaseHint }}</p>
            <el-button type="primary" size="large" :loading="acting" @click="act">{{ actionText }}</el-button>
            <button v-if="showOpenLauncher" type="button" class="secondary-action" @click="openInLauncher">
              {{ t("market.detail.getInLauncher") }} <span aria-hidden="true">↗</span>
            </button>
            <small>{{ launcherHint }}</small>
          </div>
        </section>

        <section class="content-grid">
          <div class="description-card">
            <span class="section-kicker">PCL N PLUGIN</span>
            <h2>{{ t("market.detail.overview") }}</h2>
            <p class="description">{{ plugin.description || plugin.summary || t("market.detail.noDescription") }}</p>
            <template v-if="plugin.tags.length">
              <h3>{{ t("market.detail.tags") }}</h3>
              <div class="tag-list"><span v-for="tag in plugin.tags" :key="tag">{{ tag }}</span></div>
            </template>
          </div>
          <aside class="metadata-card">
            <dl>
              <div><dt>{{ t("market.detail.pluginId") }}</dt><dd>{{ plugin.pluginId }}</dd></div>
              <div><dt>{{ t("market.detail.latestVersion") }}</dt><dd>{{ plugin.latestVersion || "—" }}</dd></div>
              <div><dt>{{ t("market.detail.publisher") }}</dt><dd>{{ plugin.publisherName || plugin.publisherId || "—" }}</dd></div>
              <div><dt>{{ t("market.detail.permissions") }}</dt><dd>{{ plugin.permissions?.join(" · ") || t("market.detail.noPermissions") }}</dd></div>
            </dl>
          </aside>
        </section>

        <section class="policy-card">
          <span aria-hidden="true">i</span>
          <div><h2>{{ t("market.detail.policyTitle") }}</h2><p>{{ t("market.detail.policy") }}</p></div>
        </section>
      </article>
    </div>

    <el-dialog v-model="redeemVisible" :title="t('market.detail.redeemTitle')" width="min(520px, 92vw)" class="market-dialog">
      <el-alert :title="t('market.detail.redeemNotice')" type="info" show-icon :closable="false" />
      <el-form label-position="top" class="redeem-form">
        <el-form-item :label="t('market.detail.orderNumber')">
          <el-input v-model="orderNumber" :placeholder="t('market.detail.orderPlaceholder')" autocomplete="off" />
        </el-form-item>
        <el-form-item :label="t('market.detail.extraAmount')">
          <el-radio-group v-model="destination">
            <el-radio value="publisher">{{ t("market.detail.publisherSupport") }}</el-radio>
            <el-radio value="platform">{{ t("market.detail.platformSupport") }}</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="redeemVisible = false">{{ t("market.detail.cancel") }}</el-button>
        <el-button type="primary" :loading="redeeming" @click="redeem">{{ t("market.detail.verify") }}</el-button>
      </template>
    </el-dialog>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import MarketHeader from "@/components/market/MarketHeader.vue";
import { pluginCenterApi, type MarketPlugin } from "@/api/pluginCenter";
import useUserStore from "@/stores/modules/user";

const { t, te, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const plugin = ref<MarketPlugin>();
const loading = ref(true);
const error = ref("");
const entitled = ref(false);
const redeemVisible = ref(false);
const redeeming = ref(false);
const acting = ref(false);
const orderNumber = ref("");
const destination = ref("publisher");

const money = (cents: number) => new Intl.NumberFormat(locale.value === "zh" ? "zh-CN" : "en-US", {
  style: "currency",
  currency: "CNY"
}).format(cents / 100);
const pluginInitial = computed(() => Array.from(plugin.value?.name?.trim() || "N")[0]?.toUpperCase() ?? "N");
const categoryLabel = (id: string) => {
  const key = `market.categories.${id}`;
  return te(key) ? t(key) : id;
};
const isFree = computed(() => plugin.value?.pricingModel === "free");
const canGetInLauncher = computed(() => Boolean(plugin.value) && (isFree.value || entitled.value));
const showOpenLauncher = computed(() => canGetInLauncher.value);
const actionText = computed(() => {
  if (!plugin.value) return t("market.detail.actionLoading");
  if (isFree.value) return t("market.detail.getInLauncher");
  if (entitled.value) return t("market.detail.owned");
  return t("market.detail.purchase");
});
const purchaseHint = computed(() => {
  if (!plugin.value) return "";
  if (isFree.value) return t("market.detail.freeHint");
  if (entitled.value) return t("market.detail.ownedHint");
  return t("market.detail.purchaseHint");
});
const launcherHint = computed(() => t("market.detail.launcherHint", {
  name: plugin.value?.name || plugin.value?.pluginId || ""
}));
const deepLink = computed(() => {
  if (!plugin.value) return "";
  const version = plugin.value.latestVersion ? `&version=${encodeURIComponent(plugin.value.latestVersion)}` : "";
  return `pcln://plugin/get?id=${encodeURIComponent(plugin.value.pluginId)}${version}`;
});

const requireLogin = async () => {
  if (userStore.token) return true;
  await router.push({ path: "/login", query: { redirect: route.fullPath } });
  return false;
};
const openInLauncher = async () => {
  if (!plugin.value) return;
  try {
    await navigator.clipboard.writeText(plugin.value.pluginId);
    ElMessage.success(t("market.detail.copied", { id: plugin.value.pluginId }));
  } catch {
    // Clipboard access is optional; the launcher deep link still works.
  }
  window.location.href = deepLink.value;
  ElMessage.info(t("market.detail.openHint"));
};
const act = async () => {
  if (!plugin.value || acting.value) return;
  acting.value = true;
  try {
    if (isFree.value || entitled.value) {
      await openInLauncher();
      return;
    }
    if (!(await requireLogin())) return;
    redeemVisible.value = true;
  } finally {
    acting.value = false;
  }
};
const redeem = async () => {
  if (!plugin.value || !orderNumber.value.trim()) {
    ElMessage.warning(t("market.detail.orderRequired"));
    return;
  }
  redeeming.value = true;
  try {
    await pluginCenterApi.redeemPurchase(plugin.value.pluginId, orderNumber.value.trim(), destination.value);
    entitled.value = true;
    redeemVisible.value = false;
    orderNumber.value = "";
    ElMessage.success(t("market.detail.redeemSuccess"));
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : t("market.detail.redeemFailed"));
  } finally {
    redeeming.value = false;
  }
};

watchEffect(() => {
  document.title = plugin.value ? `${plugin.value.name} · ${t("project.title")}` : t("project.title");
  document.documentElement.lang = locale.value === "zh" ? "zh-CN" : "en-US";
});
onMounted(async () => {
  try {
    plugin.value = await pluginCenterApi.getMarketPlugin(String(route.params.pluginId));
    if (userStore.token) {
      entitled.value = (await pluginCenterApi.getEntitlement(plugin.value.pluginId)).entitled;
    } else if (plugin.value.pricingModel === "free") {
      entitled.value = true;
    }
  } catch (e) {
    error.value = e instanceof Error && !(e instanceof TypeError) ? e.message : t("market.detail.loadFailed");
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped lang="scss">
.detail-page {
  --market-bg: #f5f7fb;
  --market-surface: rgba(255, 255, 255, .9);
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
    radial-gradient(circle at 92% 5%, rgba(111, 92, 255, .14), transparent 27rem),
    var(--market-bg);
}
:global(html.dark) .detail-page {
  --market-bg: #0f1118;
  --market-surface: rgba(24, 27, 38, .92);
  --market-surface-solid: #181b26;
  --market-surface-soft: rgba(255, 255, 255, .055);
  --market-border: rgba(214, 220, 255, .11);
  --market-text: #f1f3fa;
  --market-muted: #a2a9bd;
  --market-accent: #7d8fff;
  --market-accent-soft: rgba(125, 143, 255, .13);
}
.detail-shell { width: min(1100px, calc(100% - 40px)); margin: 0 auto; padding: 34px 0 76px; }
.back-link { display: inline-flex; align-items: center; gap: 9px; color: var(--market-muted); font-size: 13px; }
.back-link span { width: 28px; height: 28px; display: grid; place-items: center; border: 1px solid var(--market-border); border-radius: 9px; color: var(--market-text); }
.back-link:hover { color: var(--market-accent); }
.loading-card { margin-top: 34px; padding: 34px; border: 1px solid var(--market-border); border-radius: 18px; background: var(--market-surface); }
.loading-card p { margin: 20px 0 0; color: var(--market-muted); text-align: center; }
.headline { padding: 58px 0 50px; display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 60px; align-items: center; }
.identity { display: flex; align-items: flex-start; gap: 22px; }
.plugin-icon { width: 72px; height: 72px; flex: 0 0 auto; display: grid; place-items: center; border-radius: 20px; color: #fff; background: linear-gradient(145deg, #667cff, #8a54ee); box-shadow: 0 16px 38px rgba(100, 91, 238, .25); font-size: 28px; font-weight: 850; }
.category { color: var(--market-accent); font-size: 12px; font-weight: 750; letter-spacing: .06em; }
.identity h1 { margin: 8px 0 12px; font-size: clamp(42px, 6vw, 68px); line-height: 1.05; letter-spacing: -.055em; }
.identity p { max-width: 650px; margin: 0; color: var(--market-muted); font-size: 16px; line-height: 1.75; }
.purchase-card { padding: 23px; display: flex; flex-direction: column; gap: 10px; border: 1px solid var(--market-border); border-radius: 19px; background: var(--market-surface); box-shadow: 0 24px 60px rgba(32, 42, 80, .1); }
.purchase-label { align-self: flex-start; padding: 5px 9px; border-radius: 8px; color: var(--market-accent); background: var(--market-accent-soft); font-size: 12px; font-weight: 750; }
.purchase-card > strong { margin-top: 3px; font-size: 19px; }
.purchase-card > p { margin: 0 0 7px; color: var(--market-muted); font-size: 12px; line-height: 1.55; }
.purchase-card :deep(.el-button) { width: 100%; margin: 0; border-radius: 10px; }
.secondary-action { min-height: 40px; border: 1px solid var(--market-border); border-radius: 10px; color: var(--market-text); background: var(--market-surface-soft); font: inherit; font-size: 13px; cursor: pointer; }
.secondary-action:hover { color: var(--market-accent); border-color: rgba(88, 112, 244, .38); }
.purchase-card small { margin-top: 4px; color: var(--market-muted); font-size: 10px; line-height: 1.55; }
.content-grid { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 20px; }
.description-card, .metadata-card { padding: 28px; border: 1px solid var(--market-border); border-radius: 18px; background: var(--market-surface); }
.section-kicker { color: var(--market-accent); font-size: 10px; font-weight: 800; letter-spacing: .16em; }
.description-card h2 { margin: 8px 0 20px; font-size: 24px; letter-spacing: -.025em; }
.description { min-height: 130px; margin: 0; color: var(--market-muted); white-space: pre-wrap; line-height: 1.85; }
.description-card h3 { margin: 28px 0 11px; font-size: 13px; }
.tag-list { display: flex; flex-wrap: wrap; gap: 7px; }
.tag-list span { padding: 5px 9px; border: 1px solid var(--market-border); border-radius: 8px; color: var(--market-muted); font-size: 11px; }
dl { margin: 0; }
dl > div { padding: 16px 0; border-bottom: 1px solid var(--market-border); }
dl > div:first-child { padding-top: 0; }
dl > div:last-child { padding-bottom: 0; border-bottom: 0; }
dt { margin-bottom: 6px; color: var(--market-muted); font-size: 10px; font-weight: 750; letter-spacing: .08em; text-transform: uppercase; }
dd { margin: 0; overflow-wrap: anywhere; font-size: 13px; line-height: 1.55; }
.policy-card { margin-top: 20px; padding: 20px 23px; display: flex; align-items: flex-start; gap: 14px; border: 1px solid rgba(230, 164, 52, .24); border-radius: 16px; background: rgba(230, 164, 52, .08); }
.policy-card > span { width: 27px; height: 27px; flex: 0 0 auto; display: grid; place-items: center; border-radius: 50%; color: #b77910; background: rgba(230, 164, 52, .16); font-family: serif; font-weight: 800; }
.policy-card h2 { margin: 1px 0 6px; font-size: 13px; }
.policy-card p { margin: 0; color: var(--market-muted); font-size: 11px; line-height: 1.65; }
.redeem-form { margin-top: 20px; }
.redeem-form :deep(.el-radio-group) { display: grid; gap: 10px; }

@media (max-width: 850px) {
  .headline { grid-template-columns: 1fr; gap: 28px; padding-top: 42px; }
  .purchase-card { max-width: none; }
  .content-grid { grid-template-columns: 1fr; }
}
@media (max-width: 620px) {
  .detail-shell { width: min(100% - 28px, 1100px); padding-top: 22px; }
  .headline { padding: 38px 0; }
  .identity { display: grid; gap: 16px; }
  .plugin-icon { width: 58px; height: 58px; border-radius: 17px; }
  .identity h1 { font-size: 42px; }
  .description-card, .metadata-card { padding: 21px; }
}
</style>
