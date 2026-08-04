<template>
  <div class="center-page">
    <header class="page-heading">
      <div>
        <el-tag size="small" effect="plain" round>{{ t("admin.workspace") }}</el-tag>
        <h1>{{ t("admin.withdrawals.title") }}</h1>
        <p>{{ t("admin.withdrawals.description") }}</p>
      </div>
      <el-button :loading="loading" @click="load">{{ t("admin.refresh") }}</el-button>
    </header>
    <el-table :data="rows" v-loading="loading" stripe>
      <el-table-column prop="organization_id" :label="t('admin.withdrawals.organization')" min-width="200" />
      <el-table-column :label="t('admin.withdrawals.amount')" min-width="120">
        <template #default="s">¥{{ (s.row.amount_cents / 100).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column prop="payout_account_mask" :label="t('admin.withdrawals.payoutAccount')" min-width="160" />
      <el-table-column :label="t('admin.withdrawals.status')" min-width="120">
        <template #default="s">{{ statusLabel(s.row.status) }}</template>
      </el-table-column>
      <el-table-column :label="t('admin.actions')" width="240">
        <template #default="s">
          <el-button v-if="s.row.status === 'pending'" link type="success" @click="decide(s.row.id, 'approved')">{{ t("admin.withdrawals.approve") }}</el-button>
          <el-button v-if="s.row.status === 'pending'" link type="danger" @click="decide(s.row.id, 'rejected')">{{ t("admin.withdrawals.reject") }}</el-button>
          <el-button v-if="s.row.status === 'approved'" link type="primary" @click="decide(s.row.id, 'paid')">{{ t("admin.withdrawals.markPaid") }}</el-button>
        </template>
      </el-table-column>
      <template #empty><el-empty :description="t('admin.empty')" /></template>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage, ElMessageBox } from "element-plus";
import { supabase } from "@/lib/supabase";
import { pluginCenterApi } from "@/api/pluginCenter";

const { t } = useI18n();
const rows = ref<any[]>([]);
const loading = ref(false);

const statusLabel = (status: string) => {
  const key = `admin.status.${status}`;
  const translated = t(key);
  return translated === key ? status : translated;
};

const load = async () => {
  loading.value = true;
  const { data, error } = await supabase
    .from("plugin_center_withdrawals")
    .select("*")
    .order("requested_at", { ascending: false });
  if (error) ElMessage.error(error.message);
  rows.value = data ?? [];
  loading.value = false;
};

const decide = async (id: string, decision: string) => {
  let reason = "";
  if (decision === "rejected") {
    const result = await ElMessageBox.prompt(
      t("admin.withdrawals.rejectReason"),
      t("admin.withdrawals.dialogTitle")
    );
    reason = result.value;
  }
  await pluginCenterApi.decideWithdrawal(id, decision, reason);
  ElMessage.success(t("admin.withdrawals.updated"));
  await load();
};

onMounted(load);
</script>

<style scoped>
.center-page { padding: 4px; }
.page-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 22px;
}
.page-heading h1 {
  margin: 10px 0 8px;
  font-size: 26px;
  color: var(--el-text-color-primary);
}
.page-heading p {
  margin: 0;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}
</style>
