<template>
  <div class="center-page">
    <header class="page-heading">
      <div>
        <el-tag size="small" effect="plain" round>Admin Workspace</el-tag>
        <h1>审核队列</h1>
        <p>领取提交后检查包哈希、Manifest 与发布说明，并记录明确的审核决定。</p>
      </div>
      <el-button :loading="loading" @click="loadReviews">刷新</el-button>
    </header>

    <el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon :closable="false" class="data-alert" />
    <el-card shadow="never" class="table-card">
      <el-table v-loading="loading" :data="reviews" stripe>
        <el-table-column label="插件 ID" min-width="230" prop="version.plugin.plugin_id" />
        <el-table-column label="版本" prop="version.version" />
        <el-table-column label="状态">
          <template #default="scope"><el-tag :type="statusType(scope.row.status)" round>{{ statusLabel(scope.row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="包哈希" min-width="250">
          <template #default="scope"><span class="hash">{{ scope.row.version.package_sha256 }}</span></template>
        </el-table-column>
        <el-table-column label="发布者说明" min-width="220" prop="publisher_notes" show-overflow-tooltip />
        <el-table-column label="提交时间" min-width="180">
          <template #default="scope">{{ formatDate(scope.row.submitted_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" min-width="250" fixed="right">
          <template #default="scope">
            <template v-if="['pending', 'in_review'].includes(scope.row.status)">
              <el-button v-if="scope.row.status === 'pending'" link type="primary" :loading="actingId === scope.row.id" @click="claim(scope.row.id)">领取</el-button>
              <el-button link type="success" @click="openDecision(scope.row, 'approved')">通过</el-button>
              <el-button link type="warning" @click="openDecision(scope.row, 'changes_requested')">要求修改</el-button>
              <el-button link type="danger" @click="openDecision(scope.row, 'rejected')">拒绝</el-button>
            </template>
            <span v-else>{{ scope.row.decision_reason || "已结束" }}</span>
          </template>
        </el-table-column>
        <template #empty><el-empty description="目前没有审核提交" /></template>
      </el-table>
    </el-card>

    <el-dialog v-model="decisionDialog" :title="decisionTitle" width="560px" destroy-on-close>
      <el-descriptions v-if="selectedReview" :column="1" border class="review-summary">
        <el-descriptions-item label="插件">{{ selectedReview.version.plugin.plugin_id }}</el-descriptions-item>
        <el-descriptions-item label="版本">{{ selectedReview.version.version }}</el-descriptions-item>
        <el-descriptions-item label="SHA-256"><span class="hash">{{ selectedReview.version.package_sha256 }}</span></el-descriptions-item>
      </el-descriptions>
      <el-form label-position="top">
        <el-form-item label="审核意见" :required="decision !== 'approved'">
          <el-input v-model="decisionReason" type="textarea" :rows="5" placeholder="拒绝或要求修改时至少填写 3 个字符" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="decisionDialog = false">取消</el-button>
        <el-button :type="decisionButtonType" :loading="actingId === selectedReview?.id" @click="submitDecision">确认{{ decisionTitle }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { pluginCenterApi } from "@/api/pluginCenter";
import { supabase } from "@/lib/supabase";

interface ReviewRow {
  id: string;
  status: string;
  publisher_notes: string;
  decision_reason: string;
  submitted_at: string;
  version: {
    version: string;
    package_sha256: string;
    plugin: { plugin_id: string; display_name: string };
  };
}

const loading = ref(false);
const errorMessage = ref("");
const actingId = ref("");
const reviews = ref<ReviewRow[]>([]);
const decisionDialog = ref(false);
const selectedReview = ref<ReviewRow>();
const decision = ref("approved");
const decisionReason = ref("");

const decisionTitle = computed(() => ({
  approved: "通过审核",
  rejected: "拒绝发布",
  changes_requested: "要求修改"
} as Record<string, string>)[decision.value] ?? "审核");
const decisionButtonType = computed<"success" | "warning" | "danger">(() => {
  if (decision.value === "approved") return "success";
  if (decision.value === "changes_requested") return "warning";
  return "danger";
});

const loadReviews = async () => {
  loading.value = true;
  errorMessage.value = "";
  const { data, error } = await supabase
    .from("plugin_center_review_submissions")
    .select("*, version:plugin_center_plugin_versions(version, package_sha256, plugin:plugin_center_plugins(plugin_id, display_name))")
    .order("submitted_at", { ascending: false });
  if (error) errorMessage.value = error.message;
  reviews.value = (data ?? []) as unknown as ReviewRow[];
  loading.value = false;
};

const claim = async (reviewId: string) => {
  actingId.value = reviewId;
  try {
    await pluginCenterApi.claimReview(reviewId);
    ElMessage.success("已领取审核任务");
    await loadReviews();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "领取失败");
  } finally {
    actingId.value = "";
  }
};

const openDecision = (row: ReviewRow, nextDecision: string) => {
  selectedReview.value = row;
  decision.value = nextDecision;
  decisionReason.value = "";
  decisionDialog.value = true;
};

const submitDecision = async () => {
  if (!selectedReview.value) return;
  if (decision.value !== "approved" && decisionReason.value.trim().length < 3) {
    ElMessage.warning("请填写至少 3 个字符的审核意见");
    return;
  }
  actingId.value = selectedReview.value.id;
  try {
    await pluginCenterApi.decideReview(selectedReview.value.id, decision.value, decisionReason.value.trim());
    ElMessage.success("审核决定已保存");
    decisionDialog.value = false;
    await loadReviews();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "审核操作失败");
  } finally {
    actingId.value = "";
  }
};

const statusLabels: Record<string, string> = {
  pending: "待处理", in_review: "审核中", changes_requested: "需修改", approved: "已通过", rejected: "已拒绝", cancelled: "已取消"
};
const statusLabel = (status: string) => statusLabels[status] ?? status;
const statusType = (status: string): "success" | "warning" | "danger" | "info" => {
  if (status === "approved") return "success";
  if (status === "rejected") return "danger";
  if (["pending", "in_review", "changes_requested"].includes(status)) return "warning";
  return "info";
};
const formatDate = (value: string) => new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

onMounted(loadReviews);
</script>

<style scoped lang="scss">
.center-page { padding: 4px; }
.page-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-bottom: 22px; }
.page-heading h1 { margin: 10px 0 8px; font-size: 26px; }
.page-heading p { margin: 0; line-height: 1.7; color: var(--el-text-color-secondary); }
.data-alert { margin-bottom: 16px; }
.table-card { border-radius: 14px; }
.hash { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 12px; }
.review-summary { margin-bottom: 18px; }
@media (max-width: 760px) { .page-heading { flex-direction: column; } }
</style>
