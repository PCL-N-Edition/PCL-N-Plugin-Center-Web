<template>
  <div class="center-page">
    <header class="page-heading">
      <div>
        <el-tag size="small" effect="plain" round>Publisher Workspace</el-tag>
        <h1>审核记录</h1>
        <p>跟踪版本提交、审核分配与最终决定。仅显示你所属组织的数据。</p>
      </div>
      <el-button :loading="loading" @click="loadRows">刷新</el-button>
    </header>

    <el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon :closable="false" class="data-alert" />

    <el-card shadow="never" class="table-card">
      <el-table v-loading="loading" :data="rows" stripe>
        <el-table-column label="插件" min-width="180">
          <template #default="scope">{{ scope.row.version?.plugin?.display_name || "—" }}</template>
        </el-table-column>
        <el-table-column label="版本" min-width="100">
          <template #default="scope">{{ scope.row.version?.version || "—" }}</template>
        </el-table-column>
        <el-table-column label="审核状态" prop="status" min-width="120" />
        <el-table-column label="提交说明" prop="publisher_notes" min-width="220" />
        <el-table-column label="审核意见" prop="decision_reason" min-width="220" />
        <el-table-column label="提交时间" min-width="180">
          <template #default="scope">{{ formatDate(scope.row.submitted_at) }}</template>
        </el-table-column>
        <template #empty><el-empty description="暂无审核记录" /></template>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { pluginCenterApi } from "@/api/pluginCenter";

const loading = ref(false);
const rows = ref<Record<string, any>[]>([]);
const errorMessage = ref("");

const formatDate = (value: string) => value
  ? new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
  : "—";

const loadRows = async () => {
  loading.value = true;
  errorMessage.value = "";
  try {
    rows.value = await pluginCenterApi.listMyReviews();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "加载失败";
    rows.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(loadRows);
</script>

<style scoped lang="scss">
.center-page { padding: 4px; }
.page-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-bottom: 22px; }
.page-heading h1 { margin: 10px 0 8px; font-size: 26px; }
.page-heading p { margin: 0; line-height: 1.7; color: var(--el-text-color-secondary); }
.data-alert { margin-bottom: 16px; }
.table-card { border-radius: 14px; }
</style>
