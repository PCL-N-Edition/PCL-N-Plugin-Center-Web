<template>
  <main class="account-page">
    <header class="account-header">
      <div><span class="eyebrow">PCL N ONLINE SERVICES</span><h1>账户与设备</h1><p>管理统一身份、公开资料和 PCL N 桌面端连接。</p></div>
      <router-link to="/market"><el-button>返回插件市场</el-button></router-link>
    </header>

    <el-alert v-if="message" :title="message" :type="messageType" show-icon :closable="false" />
    <section class="account-grid">
      <el-card shadow="never">
        <template #header><strong>公开资料</strong></template>
        <el-form label-position="top">
          <el-form-item label="显示名"><el-input v-model="profile.displayName" maxlength="80" /></el-form-item>
          <el-form-item label="头像 URL"><el-input v-model="profile.avatarUrl" /></el-form-item>
          <el-form-item label="个人简介"><el-input v-model="profile.bio" type="textarea" maxlength="500" show-word-limit /></el-form-item>
          <el-button type="primary" :loading="saving" @click="saveProfile">保存资料</el-button>
        </el-form>
      </el-card>

      <el-card shadow="never">
        <template #header><strong>登录方式</strong></template>
        <p class="muted">同一邮箱只允许一个账户。新增登录方式必须从当前账户显式绑定，不会按邮箱静默合并。</p>
        <div class="provider-row" v-for="provider in providers" :key="provider">
          <span>{{ providerLabel(provider) }}</span><el-tag type="success">已绑定</el-tag>
        </div>
        <div class="actions">
          <el-button :disabled="providers.includes('github')" @click="linkProvider('github')">绑定 GitHub</el-button>
          <el-button :disabled="providers.includes('azure')" @click="linkProvider('azure')">绑定 Microsoft</el-button>
        </div>
      </el-card>

      <el-card v-if="pairingCode" shadow="never" class="pairing-card">
        <template #header><strong>连接 PCL N 桌面端</strong></template>
        <el-alert title="仅当配对码与桌面端显示一致时才确认。确认不会向网页或插件公开 Microsoft、Xbox 或 Minecraft Token。" type="warning" show-icon :closable="false" />
        <div class="pairing-code">{{ maskedPairingCode }}</div>
        <el-select v-model="pairingProvider" aria-label="配对登录方式">
          <el-option label="GitHub" value="github" />
          <el-option label="Microsoft" value="azure" />
        </el-select>
        <el-button type="primary" :loading="approving" @click="approvePairing">确认连接此设备</el-button>
      </el-card>

      <el-card shadow="never">
        <template #header><strong>Minecraft 档案</strong></template>
        <dl class="details"><dt>名称</dt><dd>{{ account?.profile?.minecraft_name || '未连接' }}</dd><dt>拥有 Minecraft</dt><dd>{{ account?.profile?.owns_minecraft ? '是' : '未验证' }}</dd></dl>
        <p class="muted">Minecraft Token 仅保存在第一方桌面账户服务，不会写入公开资料或开放给插件。</p>
      </el-card>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { pluginCenterApi } from "@/api/pluginCenter";
import { supabase } from "@/lib/supabase";

const route = useRoute();
const account = ref<any>(null);
const providers = ref<string[]>([]);
const profile = reactive({ displayName: "", avatarUrl: "", bio: "" });
const saving = ref(false);
const approving = ref(false);
const message = ref("");
const messageType = ref<"success" | "error" | "info">("info");
const pairingCode = computed(() => typeof route.query.pairing === "string" ? route.query.pairing : "");
const maskedPairingCode = computed(() => pairingCode.value ? `${pairingCode.value.slice(0, 6)}…${pairingCode.value.slice(-6)}` : "");
const pairingProvider = ref<"github" | "azure">("github");

const load = async () => {
  account.value = await pluginCenterApi.getAccount();
  providers.value = account.value.providers ?? [];
  profile.displayName = account.value.profile?.display_name ?? "";
  profile.avatarUrl = account.value.profile?.avatar_url ?? "";
  profile.bio = account.value.profile?.bio ?? "";
  const { data: sessionData } = await supabase.auth.getSession();
  const currentProvider = sessionData.session?.user.app_metadata.provider;
  if (currentProvider === "github" || currentProvider === "azure") pairingProvider.value = currentProvider;
  const pending = sessionStorage.getItem("pcln-pending-link-provider");
  if (pending === "github" || pending === "azure") {
    message.value = `已登录原账户。请点击“绑定 ${providerLabel(pending)}”完成关联。`;
    messageType.value = "info";
  }
};

const providerLabel = (provider: string) => provider === "azure" ? "Microsoft" : provider === "github" ? "GitHub" : provider;
const linkProvider = async (provider: "github" | "azure") => {
  const redirectTo = new URL("/account", window.location.origin).toString();
  const { error } = await supabase.auth.linkIdentity({ provider, options: { redirectTo, scopes: provider === "azure" ? "openid profile email offline_access XboxLive.signin" : undefined } });
  if (error) { message.value = error.message; messageType.value = "error"; return; }
  sessionStorage.removeItem("pcln-pending-link-provider");
};
const saveProfile = async () => {
  saving.value = true;
  try { await pluginCenterApi.updateProfile(profile.displayName, profile.avatarUrl, profile.bio); message.value = "资料已保存"; messageType.value = "success"; }
  catch (error) { message.value = error instanceof Error ? error.message : "保存失败"; messageType.value = "error"; }
  finally { saving.value = false; }
};
const approvePairing = async () => {
  approving.value = true;
  try {
    const { data } = await supabase.auth.getSession();
    const currentProvider = data.session?.user.app_metadata.provider;
    if (pairingProvider.value !== currentProvider) {
      throw new Error(`当前会话由 ${providerLabel(String(currentProvider ?? "未知方式"))} 签发。请退出后使用 ${providerLabel(pairingProvider.value)} 重新登录，再确认配对。`);
    }
    const currentOAuthProvider = sessionStorage.getItem("pcln-current-oauth-provider");
    const providerToken = pairingProvider.value === "azure" && currentOAuthProvider === "azure" ? data.session?.provider_token : undefined;
    if (pairingProvider.value === "azure" && !providerToken) throw new Error("请退出后使用 Microsoft 重新登录，再确认 Microsoft 配对；当前会话无法证明 Provider Token 来自 Microsoft。");
    await pluginCenterApi.approveDesktopPairing(pairingCode.value, pairingProvider.value, providerToken ?? undefined); message.value = "桌面端已连接，可以返回 PCL N。"; messageType.value = "success"; }
  catch (error) { message.value = error instanceof Error ? error.message : "配对失败"; messageType.value = "error"; }
  finally { approving.value = false; }
};

onMounted(load);
</script>

<style scoped lang="scss">
.account-page { min-height: 100vh; padding: clamp(28px, 5vw, 72px); background: var(--el-bg-color-page); }
.account-header { display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; max-width: 1120px; margin: 0 auto 28px; }
.account-header h1 { margin: 8px 0; font-size: clamp(32px, 5vw, 48px); }
.account-header p, .muted { color: var(--el-text-color-secondary); line-height: 1.7; }
.eyebrow { color: var(--el-color-primary); font-weight: 700; letter-spacing: .14em; font-size: 12px; }
.account-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; max-width: 1120px; margin: 20px auto; }
.provider-row, .actions { display: flex; justify-content: space-between; gap: 12px; align-items: center; padding: 12px 0; }
.actions { justify-content: flex-start; flex-wrap: wrap; }
.pairing-card { grid-column: 1 / -1; }
.pairing-code { margin: 20px 0; font: 700 22px ui-monospace, monospace; letter-spacing: .08em; }
.pairing-card .el-select { width: 180px; margin-right: 12px; }
.details { display: grid; grid-template-columns: 140px 1fr; gap: 12px; }
.details dt { color: var(--el-text-color-secondary); }
@media (max-width: 760px) { .account-grid { grid-template-columns: 1fr; } .account-header { flex-direction: column; } }
</style>
