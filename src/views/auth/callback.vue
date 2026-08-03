<template>
  <main class="auth-callback">
    <p>{{ status }}</p>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { consumeStoreAuthHandoff } from "@/utils/authHosts";

const router = useRouter();
const status = ref("正在完成登录…");

onMounted(async () => {
  try {
    const redirect = await consumeStoreAuthHandoff();
    if (redirect) {
      status.value = "登录成功，正在进入…";
      await router.replace(redirect);
      return;
    }
    status.value = "登录回跳无效，请重新登录。";
    await router.replace("/login");
  } catch (error) {
    status.value = error instanceof Error ? error.message : "登录回跳失败";
    await router.replace("/login?oauthError=1");
  }
});
</script>

<style scoped>
.auth-callback {
  min-height: 100vh;
  display: grid;
  place-items: center;
  color: var(--el-text-color-secondary);
  background: var(--el-bg-color-page);
}
</style>
