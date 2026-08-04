<template>
  <main class="auth-callback">
    <div class="auth-callback-card">
      <div class="brand-mark">P</div>
      <p class="status">{{ status }}</p>
      <p v-if="detail" class="detail">{{ detail }}</p>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { consumeStoreAuthHandoff } from "@/utils/authHosts";
import { applyPublicTheme } from "@/utils/publicTheme";
import { completeOAuthCallback } from "@/lib/supabase";
import useUserStore from "@/stores/modules/user";

const { t } = useI18n();
const router = useRouter();
const userStore = useUserStore();
const status = ref(t("authCallback.completing"));
const detail = ref("");

applyPublicTheme();

onMounted(async () => {
  applyPublicTheme();
  try {
    // Hash handoff from auth.pcln.top (production dual-host).
    const redirect = await consumeStoreAuthHandoff();
    if (redirect) {
      status.value = t("authCallback.success");
      await userStore.restoreSession(true);
      await router.replace(redirect);
      return;
    }

    // Same-origin PKCE return (preview / local, or misconfigured OAuth redirect).
    await completeOAuthCallback();
    await userStore.restoreSession(true);
    if (userStore.token) {
      status.value = t("authCallback.success");
      const params = new URLSearchParams(window.location.search);
      const target = params.get("redirect");
      const safe =
        target && target.startsWith("/") && !target.startsWith("//") ? target : "/market";
      await router.replace(safe);
      return;
    }

    status.value = t("authCallback.invalid");
    await router.replace("/login");
  } catch (error) {
    status.value = error instanceof Error ? error.message : t("authCallback.failed");
    detail.value = t("authCallback.invalid");
    await router.replace("/login?oauthError=1");
  }
});
</script>

<style scoped>
.auth-callback {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  color: var(--el-text-color-primary);
  background:
    radial-gradient(circle at 80% 10%, rgba(88, 112, 244, 0.16), transparent 28rem),
    radial-gradient(circle at 12% 80%, rgba(64, 162, 255, 0.1), transparent 22rem),
    var(--el-bg-color-page);
}

.auth-callback-card {
  width: min(420px, 100%);
  padding: 36px 28px;
  text-align: center;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 20px;
  background: var(--el-bg-color);
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
}

.brand-mark {
  display: inline-grid;
  place-items: center;
  width: 52px;
  height: 52px;
  margin-bottom: 18px;
  border-radius: 16px;
  color: #fff;
  font-size: 24px;
  font-weight: 800;
  background: linear-gradient(145deg, #334bc2, #6b7ff5);
}

.status {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.6;
  color: var(--el-text-color-primary);
}

.detail {
  margin: 10px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}
</style>
