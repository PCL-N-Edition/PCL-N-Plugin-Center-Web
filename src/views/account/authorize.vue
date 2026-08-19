<template>
  <main class="authorize-page">
    <section class="authorize-card">
      <span class="eyebrow">PCL N DESKTOP AUTHORIZATION</span>
      <h1>连接 PCL N 桌面端</h1>
      <p class="intro">仅当下方配对码与桌面端显示一致时继续。此操作会为当前设备创建独立会话，不会向网页或第三方插件公开 Microsoft、Xbox 或 Minecraft Token。</p>

      <el-alert v-if="message" :title="message" :type="messageType" show-icon :closable="false" />

      <template v-if="pairingCode && !approved">
        <div class="pairing-code" aria-label="配对码">{{ maskedPairingCode }}</div>
        <dl class="session-details">
          <dt>当前账户</dt><dd>{{ accountName }}</dd>
          <dt>确认方式</dt><dd>{{ providerLabel(pairingProvider) }}</dd>
        </dl>
        <el-select v-model="pairingProvider" aria-label="配对登录方式">
          <el-option v-for="provider in availableProviders" :key="provider" :label="providerLabel(provider)" :value="provider" />
        </el-select>
        <div class="actions">
          <el-button type="primary" :loading="approving" @click="approvePairing">确认连接此设备</el-button>
          <el-button :disabled="approving" @click="router.replace('/account')">取消</el-button>
        </div>
      </template>

      <router-link v-if="approved" to="/account"><el-button>管理账户与设备</el-button></router-link>
      <router-link v-else-if="!pairingCode" to="/account"><el-button>返回账户管理</el-button></router-link>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { pluginCenterApi } from "@/api/pluginCenter";
import { supabase } from "@/lib/supabase";

type OAuthProvider = "github" | "azure";

const route = useRoute();
const router = useRouter();
const account = ref<any>(null);
const approving = ref(false);
const approved = ref(false);
const message = ref("");
const messageType = ref<"success" | "error" | "info" | "warning">("info");
const pairingCode = computed(() => typeof route.query.pairing === "string" ? route.query.pairing.trim() : "");
const maskedPairingCode = computed(() => pairingCode.value ? `${pairingCode.value.slice(0, 6)}…${pairingCode.value.slice(-6)}` : "");
const currentSessionProvider = ref<OAuthProvider | null>(null);
const availableProviders = computed<OAuthProvider[]>(() => currentSessionProvider.value ? [currentSessionProvider.value] : []);
const pairingProvider = ref<OAuthProvider>("github");
const accountName = computed(() => account.value?.profile?.display_name || account.value?.email || "当前 PCL N 账户");

const providerLabel = (provider: string) => provider === "azure" ? "Microsoft" : provider === "github" ? "GitHub" : provider;

const load = async () => {
  if (!pairingCode.value) {
    message.value = "授权链接缺少配对码。请返回 PCL N 重新发起连接。";
    messageType.value = "error";
    return;
  }
  account.value = await pluginCenterApi.getAccount();
  const { data } = await supabase.auth.getSession();
  const currentProvider = data.session?.user.app_metadata.provider;
  if (currentProvider === "github" || currentProvider === "azure") {
    currentSessionProvider.value = currentProvider;
    pairingProvider.value = currentProvider;
  }

};

const approvePairing = async () => {
  approving.value = true;
  message.value = "";
  try {
    const { data } = await supabase.auth.getSession();
    const currentProvider = data.session?.user.app_metadata.provider;
    if (pairingProvider.value !== currentProvider) {
      throw new Error(`当前会话由 ${providerLabel(String(currentProvider ?? "未知方式"))} 签发。请使用 ${providerLabel(pairingProvider.value)} 重新登录后确认。`);
    }
    const currentOAuthProvider = sessionStorage.getItem("pcln-current-oauth-provider");
    const providerToken = pairingProvider.value === "azure" && currentOAuthProvider === "azure" ? data.session?.provider_token : undefined;
    if (pairingProvider.value === "azure" && !providerToken) {
      // Force a Microsoft re-login with XboxLive scope for Minecraft pairing.
      const login = new URL("/login", window.location.origin);
      login.searchParams.set("provider", "azure");
      login.searchParams.set("xbox", "1");
      login.searchParams.set("redirect", `${route.fullPath}`);
      window.location.assign(login.toString());
      return;
    }
    await pluginCenterApi.approveDesktopPairing(pairingCode.value, pairingProvider.value, providerToken ?? undefined);
    approved.value = true;
    message.value = "桌面端已连接，可以返回 PCL N。";
    messageType.value = "success";
  } catch (error) {
    message.value = error instanceof Error ? error.message : "配对失败";
    messageType.value = "error";
  } finally {
    approving.value = false;
  }
};

onMounted(() => void load().catch(error => {
  message.value = error instanceof Error ? error.message : "无法读取账户状态";
  messageType.value = "error";
}));
</script>

<style scoped lang="scss">
.authorize-page { min-height: 100vh; display: grid; place-items: center; padding: 28px; background: radial-gradient(circle at top, var(--el-color-primary-light-9), var(--el-bg-color-page) 55%); }
.authorize-card { width: min(620px, 100%); padding: clamp(28px, 6vw, 56px); border: 1px solid var(--el-border-color-lighter); border-radius: 24px; background: var(--el-bg-color); box-shadow: 0 24px 70px rgba(30, 50, 110, .12); }
.eyebrow { color: var(--el-color-primary); font-size: 12px; font-weight: 700; letter-spacing: .14em; }
h1 { margin: 12px 0; font-size: clamp(30px, 5vw, 44px); }
.intro { margin-bottom: 24px; color: var(--el-text-color-secondary); line-height: 1.8; }
.pairing-code { margin: 28px 0 20px; padding: 18px; border-radius: 14px; text-align: center; font: 700 24px ui-monospace, monospace; letter-spacing: .1em; background: var(--el-fill-color-light); }
.session-details { display: grid; grid-template-columns: 100px 1fr; gap: 10px; margin: 0 0 20px; }
.session-details dt { color: var(--el-text-color-secondary); }
.authorize-card .el-select { width: 100%; }
.actions { display: flex; gap: 12px; margin-top: 24px; }
</style>
