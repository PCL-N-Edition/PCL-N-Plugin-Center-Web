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

      <el-card shadow="never">
        <template #header><strong>Minecraft 档案</strong></template>
        <dl class="details"><dt>名称</dt><dd>{{ account?.profile?.minecraft_name || '未连接' }}</dd><dt>拥有 Minecraft</dt><dd>{{ account?.profile?.owns_minecraft ? '是' : '未验证' }}</dd></dl>
        <p class="muted">Minecraft Token 仅保存在第一方桌面账户服务，不会写入公开资料或开放给插件。</p>
      </el-card>

      <el-card shadow="never" class="devices-card">
        <template #header><div class="card-heading"><strong>已授权设备</strong><el-button text :loading="loadingDevices" @click="loadDevices">刷新</el-button></div></template>
        <el-skeleton v-if="loadingDevices && devices.length === 0" :rows="2" animated />
        <el-empty v-else-if="devices.length === 0" description="尚未授权 PCL N 桌面设备" />
        <div v-else class="device-list">
          <div v-for="device in devices" :key="device.id" class="device-row">
            <div>
              <strong>{{ device.device_name }}</strong>
              <p>最近活动：{{ formatDate(device.last_seen_at) }} · 授权：{{ formatDate(device.created_at) }}</p>
              <p>到期：{{ formatDate(device.expires_at) }}<span v-if="device.revoked_at"> · 已撤销</span></p>
            </div>
            <el-button type="danger" plain :disabled="Boolean(device.revoked_at)" :loading="revokingDeviceId === device.id" @click="revokeDevice(device)">撤销</el-button>
          </div>
        </div>
      </el-card>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { useRoute } from "vue-router";
import { pluginCenterApi, type AuthorizedDevice } from "@/api/pluginCenter";
import { supabase } from "@/lib/supabase";

const route = useRoute();
const account = ref<any>(null);
const providers = ref<string[]>([]);
const devices = ref<AuthorizedDevice[]>([]);
const profile = reactive({ displayName: "", avatarUrl: "", bio: "" });
const saving = ref(false);
const loadingDevices = ref(false);
const revokingDeviceId = ref("");
const message = ref("");
const messageType = ref<"success" | "error" | "info">("info");

const providerLabel = (provider: string) => provider === "azure" ? "Microsoft" : provider === "github" ? "GitHub" : provider;
const formatDate = (value: string) => new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

const loadDevices = async () => {
  loadingDevices.value = true;
  try { devices.value = (await pluginCenterApi.listAuthorizedDevices()).filter(device => !device.revoked_at && new Date(device.expires_at).getTime() > Date.now()); }
  catch (error) { message.value = error instanceof Error ? error.message : "无法读取授权设备"; messageType.value = "error"; }
  finally { loadingDevices.value = false; }
};

const load = async () => {
  account.value = await pluginCenterApi.getAccount();
  providers.value = account.value.providers ?? [];
  profile.displayName = account.value.profile?.display_name ?? "";
  profile.avatarUrl = account.value.profile?.avatar_url ?? "";
  profile.bio = account.value.profile?.bio ?? "";
  await loadDevices();
  const pending = sessionStorage.getItem("pcln-pending-link-provider");
  const oauthError = sessionStorage.getItem("pcln-oauth-error");
  if (route.query.identityLinkError === "1" && oauthError) {
    sessionStorage.removeItem("pcln-oauth-error");
    message.value = `Microsoft 绑定失败：${oauthError}`;
    messageType.value = "error";
  } else if (route.query.identityLinked === "1" && (pending === "github" || pending === "azure")) {
    sessionStorage.removeItem("pcln-pending-link-provider");
    message.value = `${providerLabel(pending)} 登录方式已绑定。`;
    messageType.value = "success";
  } else if (pending === "github" || pending === "azure") {
    message.value = `已登录原账户。请点击“绑定 ${providerLabel(pending)}”完成关联。`;
    messageType.value = "info";
  }
};

const linkProvider = async (provider: "github" | "azure") => {
  const redirectTo = new URL(import.meta.env.BASE_URL, window.location.origin);
  redirectTo.hash = "#/account?identityLinked=1";
  sessionStorage.setItem("pcln-pending-link-provider", provider);
  const { error } = await supabase.auth.linkIdentity({
    provider,
    options: { redirectTo: redirectTo.toString(), scopes: provider === "azure" ? "openid profile email offline_access XboxLive.signin" : undefined }
  });
  if (error) {
    message.value = /manual linking is disabled/i.test(error.message)
      ? "当前在线服务尚未启用身份手动绑定，请联系管理员开启 Supabase Manual Linking 后重试。"
      : error.message;
    messageType.value = "error";
  }
};

const saveProfile = async () => {
  saving.value = true;
  try { await pluginCenterApi.updateProfile(profile.displayName, profile.avatarUrl, profile.bio); message.value = "资料已保存"; messageType.value = "success"; }
  catch (error) { message.value = error instanceof Error ? error.message : "保存失败"; messageType.value = "error"; }
  finally { saving.value = false; }
};

const revokeDevice = async (device: AuthorizedDevice) => {
  try {
    await ElMessageBox.confirm(`撤销“${device.device_name}”后，该设备需要重新登录。`, "撤销设备授权", { type: "warning", confirmButtonText: "确认撤销", cancelButtonText: "取消" });
    revokingDeviceId.value = device.id;
    await pluginCenterApi.revokeAuthorizedDevice(device.id);
    devices.value = devices.value.filter(item => item.id !== device.id);
    message.value = "设备授权已撤销";
    messageType.value = "success";
  } catch (error) {
    if (error === "cancel" || error === "close") return;
    message.value = error instanceof Error ? error.message : "撤销设备失败";
    messageType.value = "error";
  } finally { revokingDeviceId.value = ""; }
};

onMounted(() => void load().catch(error => { message.value = error instanceof Error ? error.message : "无法读取账户"; messageType.value = "error"; }));
</script>

<style scoped lang="scss">
.account-page { min-height: 100vh; padding: clamp(28px, 5vw, 72px); background: var(--el-bg-color-page); }
.account-header { display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; max-width: 1120px; margin: 0 auto 28px; }
.account-header h1 { margin: 8px 0; font-size: clamp(32px, 5vw, 48px); }
.account-header p, .muted { color: var(--el-text-color-secondary); line-height: 1.7; }
.eyebrow { color: var(--el-color-primary); font-weight: 700; letter-spacing: .14em; font-size: 12px; }
.account-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; max-width: 1120px; margin: 20px auto; }
.provider-row, .actions, .card-heading { display: flex; justify-content: space-between; gap: 12px; align-items: center; padding: 12px 0; }
.actions { justify-content: flex-start; flex-wrap: wrap; }
.card-heading { padding: 0; }
.devices-card { grid-column: 1 / -1; }
.device-list { display: grid; gap: 12px; }
.device-row { display: flex; justify-content: space-between; gap: 20px; align-items: center; padding: 16px; border: 1px solid var(--el-border-color-lighter); border-radius: 12px; }
.device-row p { margin: 5px 0 0; color: var(--el-text-color-secondary); font-size: 13px; }
.details { display: grid; grid-template-columns: 140px 1fr; gap: 12px; }
.details dt { color: var(--el-text-color-secondary); }
@media (max-width: 760px) { .account-grid { grid-template-columns: 1fr; } .account-header, .device-row { flex-direction: column; align-items: stretch; } .devices-card { grid-column: auto; } }
</style>
