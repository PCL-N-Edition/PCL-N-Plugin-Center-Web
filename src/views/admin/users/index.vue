<template>
  <div class="center-page">
    <EntityTablePage
      eyebrow="Admin Workspace"
      title="用户"
      description="用户身份来自 Supabase Auth。复制 UUID 后可到「管理员」页任命为 admin / reviewer / auditor。"
      table="plugin_center_profiles"
      order-by="created_at"
      :columns="columns"
    />
    <el-alert
      class="hint"
      type="info"
      :closable="false"
      show-icon
      title="任命管理员：打开左侧「平台管理 → 管理员」，粘贴用户 UUID 并选择角色。"
    />
  </div>
</template>

<script setup lang="ts">
import EntityTablePage from "@/components/PluginCenter/EntityTablePage.vue";

const columns = [
  { prop: "display_name", label: "显示名称", minWidth: 180 },
  { prop: "github_login", label: "GitHub", minWidth: 160 },
  { prop: "user_id", label: "用户 UUID", minWidth: 260 },
  { prop: "created_at", label: "首次登录", kind: "date" as const, minWidth: 180 }
];
</script>

<style scoped>
.center-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.hint {
  border-radius: 12px;
}
</style>
