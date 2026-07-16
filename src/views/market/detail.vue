<template>
  <main class="detail-shell">
    <header>
      <router-link to="/market">← 返回市场</router-link>
      <nav>
        <a href="https://docs.pcln.top/" target="_blank" rel="noreferrer">开发文档</a>
        <router-link v-if="userStore.token" to="/home">工作台</router-link>
        <a v-else :href="authHref">登录</a>
      </nav>
    </header>
    <el-skeleton v-if="loading" :rows="8" animated />
    <el-result v-else-if="error" icon="error" title="无法加载插件" :sub-title="error" />
    <article v-else-if="plugin">
      <div class="headline">
        <div>
          <el-tag round>{{ plugin.category }}</el-tag>
          <h1>{{ plugin.name }}</h1>
          <p>{{ plugin.summary }}</p>
        </div>
        <div class="purchase">
          <strong>{{ plugin.pricingModel === 'free' ? '免费' : money(plugin.priceCents) }}</strong>
          <span>{{ purchaseHint }}</span>
          <el-button type="primary" size="large" :loading="acting" @click="act">{{ actionText }}</el-button>
          <el-button v-if="showOpenLauncher" size="large" @click="openInLauncher">在 PCL.N 启动器中获取</el-button>
          <p class="launcher-hint">{{ launcherHint }}</p>
        </div>
      </div>
      <div class="content">
        <section>
          <h2>插件介绍</h2>
          <p class="description">{{ plugin.description || plugin.summary || '开发者暂未提供详细介绍。' }}</p>
          <h3>标签</h3>
          <el-tag v-for="tag in plugin.tags" :key="tag" class="tag">{{ tag }}</el-tag>
        </section>
        <aside>
          <dl>
            <dt>插件 ID</dt><dd>{{ plugin.pluginId }}</dd>
            <dt>最新版本</dt><dd>{{ plugin.latestVersion || '—' }}</dd>
            <dt>发布者</dt><dd>{{ plugin.publisherName || plugin.publisherId || '—' }}</dd>
            <dt>权限</dt><dd>{{ plugin.permissions?.join('、') || '无额外权限' }}</dd>
          </dl>
        </aside>
      </div>
    </article>
    <div class="policy">
      订单兑换即视为数字内容永久授权已交付，购买后不支持退款。请在兑换前确认插件信息与金额；欺诈、重复扣款或法律另有强制规定的异常情况请联系平台人工处理。
      插件安装与市场验签在 PCL.N 桌面启动器内完成（类似 App Store：网页浏览/购买，设备内获取）。
    </div>
    <el-dialog v-model="redeemVisible" title="验证爱发电订单" width="min(520px, 92vw)">
      <el-alert title="请先在平台爱发电主页自选金额赞助，金额不得低于插件价格。订单只能兑换一次。" type="info" show-icon :closable="false" />
      <el-form label-position="top" class="form">
        <el-form-item label="爱发电订单号"><el-input v-model="orderNumber" autocomplete="off" /></el-form-item>
        <el-form-item label="超额金额用于">
          <el-radio-group v-model="destination">
            <el-radio value="publisher">赞助发布者（仍按10%/90%分成）</el-radio>
            <el-radio value="platform">赞助平台</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="redeemVisible = false">取消</el-button>
        <el-button type="primary" :loading="redeeming" @click="redeem">验证并授权</el-button>
      </template>
    </el-dialog>
  </main>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { pluginCenterApi, type MarketPlugin } from '@/api/pluginCenter';
import useUserStore from '@/stores/modules/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const plugin = ref<MarketPlugin>();
const loading = ref(true);
const error = ref('');
const entitled = ref(false);
const redeemVisible = ref(false);
const redeeming = ref(false);
const acting = ref(false);
const orderNumber = ref('');
const destination = ref('publisher');

const money = (c: number) => `¥${(c / 100).toFixed(2)}`;
const isFree = computed(() => plugin.value?.pricingModel === 'free');
const canGetInLauncher = computed(() => Boolean(plugin.value) && (isFree.value || entitled.value));
const showOpenLauncher = computed(() => canGetInLauncher.value);
const actionText = computed(() => {
  if (!plugin.value) return '加载中';
  if (isFree.value) return '在启动器中获取';
  if (entitled.value) return '已拥有 · 在启动器中获取';
  return '购买 / 验证订单';
});
const purchaseHint = computed(() => {
  if (!plugin.value) return '';
  if (isFree.value) return '免费插件无需交易记录，直接在 PCL.N 启动器「市场」点「获取」';
  if (entitled.value) return '已获得永久授权，请在启动器中完成安装与市场验签';
  return '一次购买，永久授权；购买后回到启动器获取';
});
const launcherHint = computed(() =>
  `打开 PCL.N → 设置 → 插件 → 市场 → 搜索「${plugin.value?.name || plugin.value?.pluginId || ''}」→ 点击「获取」。安装包仅在启动器内下载并验签，网页不直接下发 .pnp。`
);
const authHref = computed(() => `https://auth.pcln.top/#/login?redirect=${encodeURIComponent(route.fullPath)}`);
const deepLink = computed(() => {
  if (!plugin.value) return '';
  const version = plugin.value.latestVersion ? `&version=${encodeURIComponent(plugin.value.latestVersion)}` : '';
  return `pcln://plugin/get?id=${encodeURIComponent(plugin.value.pluginId)}${version}`;
});

const requireLogin = async () => {
  if (userStore.token) return true;
  await router.push({ path: '/login', query: { redirect: route.fullPath } });
  return false;
};

const openInLauncher = async () => {
  if (!plugin.value) return;
  const link = deepLink.value;
  try {
    await navigator.clipboard.writeText(plugin.value.pluginId);
    ElMessage.success(`已复制插件 ID：${plugin.value.pluginId}`);
  } catch {
    /* clipboard may be blocked */
  }
  // Best-effort custom scheme; browsers that lack a registered handler simply no-op.
  window.location.href = link;
  ElMessage.info('请在 PCL.N 启动器「市场」中搜索并点击「获取」。若已安装启动器，浏览器可能尝试打开它。');
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
    ElMessage.warning('请输入订单号');
    return;
  }
  redeeming.value = true;
  try {
    await pluginCenterApi.redeemPurchase(plugin.value.pluginId, orderNumber.value.trim(), destination.value);
    entitled.value = true;
    redeemVisible.value = false;
    orderNumber.value = '';
    ElMessage.success('订单验证成功，已获得永久授权。请打开 PCL.N 启动器完成获取。');
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '订单验证失败');
  } finally {
    redeeming.value = false;
  }
};

onMounted(async () => {
  try {
    plugin.value = await pluginCenterApi.getMarketPlugin(String(route.params.pluginId));
    if (userStore.token) {
      entitled.value = (await pluginCenterApi.getEntitlement(plugin.value.pluginId)).entitled;
    } else if (plugin.value.pricingModel === 'free') {
      entitled.value = true;
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败';
  } finally {
    loading.value = false;
  }
});
</script>
<style scoped lang="scss">
.detail-shell { min-height: 100vh; padding: 0 clamp(20px, 7vw, 110px) 70px; background: var(--el-bg-color-page); }
header { height: 72px; display: flex; justify-content: space-between; align-items: center; }
header nav { display: flex; align-items: center; gap: 20px; }
header nav a { color: var(--el-text-color-regular); }
header nav a:hover { color: var(--el-color-primary); }
.headline { display: grid; grid-template-columns: 1fr 320px; gap: 40px; padding: 64px 0; }
.headline h1 { font-size: clamp(36px, 5vw, 60px); margin: 16px 0; }
.headline p { font-size: 18px; color: var(--el-text-color-secondary); }
.purchase { display: flex; flex-direction: column; gap: 12px; padding: 26px; border-radius: 20px; background: var(--el-bg-color); box-shadow: 0 18px 50px rgba(35, 48, 110, 0.1); }
.purchase strong { font-size: 34px; }
.purchase span, .launcher-hint { color: var(--el-text-color-secondary); }
.launcher-hint { margin: 4px 0 0; font-size: 13px; line-height: 1.55; }
.content { display: grid; grid-template-columns: 1fr 320px; gap: 28px; }
.content section, .content aside { padding: 28px; border-radius: 18px; background: var(--el-bg-color); }
.description { white-space: pre-wrap; line-height: 1.8; }
.policy { margin-top: 24px; padding: 16px; border-radius: 12px; color: var(--el-color-warning-dark-2); background: var(--el-color-warning-light-9); line-height: 1.6; }
.tag { margin: 0 8px 8px 0; }
dl { margin: 0; }
dt { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 16px; }
dd { margin: 5px 0; word-break: break-all; }
.form { margin-top: 20px; }
@media (max-width: 800px) {
  .headline, .content { grid-template-columns: 1fr; }
  .headline { padding-top: 34px; }
}
</style>
