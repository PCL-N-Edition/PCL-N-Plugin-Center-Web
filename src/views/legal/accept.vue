<template>
  <main class="legal-page">
    <section class="legal-card">
      <el-tag effect="plain" round>N Cloud</el-tag>
      <h1>首次使用须知</h1>
      <p class="lead">
        创建或登录 N Cloud / 插件中心账户前，请阅读并同意用户服务协议与隐私保护协议。
        当前协议版本：{{ version }}
      </p>

      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="协议文本已嵌入本站点，可离线打开 Markdown 全文。"
        class="mb"
      />

      <div class="doc-links">
        <a :href="urls.terms" target="_blank" rel="noreferrer">《N Cloud 用户服务协议》</a>
        <a :href="urls.privacy" target="_blank" rel="noreferrer">《N Cloud 隐私保护协议》</a>
      </div>

      <el-checkbox v-model="accepted" class="accept-box">
        我已阅读并同意《N Cloud 用户服务协议》和《N Cloud 隐私保护协议》
      </el-checkbox>

      <div class="actions">
        <el-button @click="decline">不同意</el-button>
        <el-button type="primary" :disabled="!accepted" @click="confirm">同意并继续</el-button>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  NCLOUD_LEGAL_VERSION,
  acceptNCloudLegal,
  legalDocumentUrls
} from "@/utils/legal";
import { LOGIN_URL } from "@/config";
import {
  handoffSessionToStore,
  isAuthHost,
  isLocalAuthHost,
  replaceWithAuthLogin
} from "@/utils/authHosts";
import useUserStore from "@/stores/modules/user";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const accepted = ref(false);
const version = NCLOUD_LEGAL_VERSION;
const urls = legalDocumentUrls;

const confirm = async () => {
  if (!accepted.value) {
    ElMessage.warning("请先阅读并勾选同意协议");
    return;
  }
  acceptNCloudLegal();
  const redirect = typeof route.query.redirect === "string" && route.query.redirect.startsWith("/")
    ? route.query.redirect
    : "/market";
  if (isAuthHost() && !isLocalAuthHost() && userStore.token) {
    await handoffSessionToStore(redirect);
    return;
  }
  await router.replace(redirect);
};

const decline = async () => {
  ElMessage.info("未同意协议，无法使用需要登录的 N Cloud 功能");
  if (isAuthHost() || isLocalAuthHost()) {
    await router.replace(LOGIN_URL);
    return;
  }
  replaceWithAuthLogin("/");
};
</script>

<style scoped>
.legal-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px 16px;
  background: var(--el-bg-color-page);
}
.legal-card {
  width: min(640px, 100%);
  padding: 32px;
  border-radius: 20px;
  background: var(--el-bg-color);
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
}
.legal-card h1 {
  margin: 16px 0 10px;
  font-size: 28px;
}
.lead {
  margin: 0 0 18px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}
.mb {
  margin-bottom: 18px;
}
.doc-links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  margin-bottom: 18px;
}
.doc-links a {
  color: var(--el-color-primary);
  font-weight: 600;
}
.accept-box {
  display: flex;
  align-items: flex-start;
  margin-bottom: 22px;
  white-space: normal;
  line-height: 1.6;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
