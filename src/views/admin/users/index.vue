<template>
  <div class="center-page">
    <EntityTablePage
      :eyebrow="t('admin.workspace')"
      :title="t('admin.users.title')"
      :description="t('admin.users.description')"
      table="plugin_center_profiles"
      order-by="created_at"
      :columns="columns"
    />
    <el-alert
      class="hint"
      type="info"
      :closable="false"
      show-icon
      :title="t('admin.users.appointHint')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import EntityTablePage from "@/components/PluginCenter/EntityTablePage.vue";

const { t } = useI18n();
const columns = computed(() => [
  { prop: "display_name", label: t("admin.users.displayName"), minWidth: 180 },
  { prop: "github_login", label: t("admin.users.github"), minWidth: 160 },
  { prop: "user_id", label: t("admin.users.userId"), minWidth: 260 },
  { prop: "created_at", label: t("admin.users.firstLogin"), kind: "date" as const, minWidth: 180 }
]);
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
