<template>
  <div class="center-page">
    <header class="page-heading">
      <div>
        <el-tag size="small" effect="plain" round>{{ t("admin.workspace") }}</el-tag>
        <h1>{{ t("admin.reviews.title") }}</h1>
        <p>{{ t("admin.reviews.description") }}</p>
      </div>
      <el-button :loading="loading" @click="loadReviews">{{ t("admin.refresh") }}</el-button>
    </header>

    <el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon :closable="false" class="data-alert" />
    <el-card shadow="never" class="table-card">
      <el-table v-loading="loading" :data="reviews" stripe>
        <el-table-column :label="t('admin.reviews.pluginId')" min-width="230" prop="version.plugin.plugin_id" />
        <el-table-column :label="t('admin.reviews.version')" prop="version.version" />
        <el-table-column :label="t('admin.reviews.status')">
          <template #default="scope"><el-tag :type="statusType(scope.row.status)" round>{{ statusLabel(scope.row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column :label="t('admin.reviews.packageHash')" min-width="250">
          <template #default="scope"><span class="hash">{{ scope.row.version.package_sha256 }}</span></template>
        </el-table-column>
        <el-table-column :label="t('admin.reviews.publisherNotes')" min-width="220" prop="publisher_notes" show-overflow-tooltip />
        <el-table-column :label="t('admin.reviews.submittedAt')" min-width="180">
          <template #default="scope">{{ formatDate(scope.row.submitted_at) }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.actions')" min-width="250" fixed="right">
          <template #default="scope">
            <template v-if="['pending', 'in_review'].includes(scope.row.status)">
              <el-button v-if="scope.row.status === 'pending'" link type="primary" :loading="actingId === scope.row.id" @click="claim(scope.row.id)">{{ t("admin.reviews.claim") }}</el-button>
              <el-button link type="success" @click="openDecision(scope.row, 'approved')">{{ t("admin.reviews.approve") }}</el-button>
              <el-button link type="warning" @click="openDecision(scope.row, 'changes_requested')">{{ t("admin.reviews.requestChanges") }}</el-button>
              <el-button link type="danger" @click="openDecision(scope.row, 'rejected')">{{ t("admin.reviews.reject") }}</el-button>
            </template>
            <span v-else>{{ scope.row.decision_reason || t("admin.reviews.closed") }}</span>
          </template>
        </el-table-column>
        <template #empty><el-empty :description="t('admin.reviews.empty')" /></template>
      </el-table>
    </el-card>

    <el-dialog v-model="decisionDialog" :title="decisionTitle" width="560px" destroy-on-close>
      <el-descriptions v-if="selectedReview" :column="1" border class="review-summary">
        <el-descriptions-item :label="t('admin.reviews.plugin')">{{ selectedReview.version.plugin.plugin_id }}</el-descriptions-item>
        <el-descriptions-item :label="t('admin.reviews.version')">{{ selectedReview.version.version }}</el-descriptions-item>
        <el-descriptions-item label="SHA-256"><span class="hash">{{ selectedReview.version.package_sha256 }}</span></el-descriptions-item>
      </el-descriptions>
      <el-form label-position="top">
        <el-form-item :label="t('admin.reviews.decisionReason')" :required="decision !== 'approved'">
          <el-input v-model="decisionReason" type="textarea" :rows="5" :placeholder="t('admin.reviews.decisionReasonHint')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="decisionDialog = false">{{ t("admin.cancel") }}</el-button>
        <el-button :type="decisionButtonType" :loading="actingId === selectedReview?.id" @click="submitDecision">{{ t("admin.reviews.confirmPrefix") }}{{ decisionTitle }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
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

const { t, locale } = useI18n();
const loading = ref(false);
const errorMessage = ref("");
const actingId = ref("");
const reviews = ref<ReviewRow[]>([]);
const decisionDialog = ref(false);
const selectedReview = ref<ReviewRow>();
const decision = ref("approved");
const decisionReason = ref("");

const decisionTitle = computed(() => ({
  approved: t("admin.reviews.approveTitle"),
  rejected: t("admin.reviews.rejectTitle"),
  changes_requested: t("admin.reviews.changesTitle")
} as Record<string, string>)[decision.value] ?? t("admin.reviews.decideTitle"));
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
    ElMessage.success(t("admin.reviews.claimSuccess"));
    await loadReviews();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t("admin.reviews.claimFailed"));
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
    ElMessage.warning(t("admin.reviews.reasonRequired"));
    return;
  }
  actingId.value = selectedReview.value.id;
  try {
    await pluginCenterApi.decideReview(selectedReview.value.id, decision.value, decisionReason.value.trim());
    ElMessage.success(t("admin.reviews.decideSuccess"));
    decisionDialog.value = false;
    await loadReviews();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t("admin.reviews.decideFailed"));
  } finally {
    actingId.value = "";
  }
};

const statusLabel = (status: string) => {
  const key = `admin.status.${status}`;
  const translated = t(key);
  return translated === key ? status : translated;
};
const statusType = (status: string): "success" | "warning" | "danger" | "info" => {
  if (status === "approved") return "success";
  if (status === "rejected") return "danger";
  if (["pending", "in_review", "changes_requested"].includes(status)) return "warning";
  return "info";
};
const formatDate = (value: string) =>
  new Intl.DateTimeFormat(locale.value === "zh" ? "zh-CN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));

onMounted(loadReviews);
</script>

<style scoped lang="scss">
.center-page { padding: 4px; }
.page-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-bottom: 22px; }
.page-heading h1 { margin: 10px 0 8px; font-size: 26px; color: var(--el-text-color-primary); }
.page-heading p { margin: 0; line-height: 1.7; color: var(--el-text-color-secondary); }
.data-alert { margin-bottom: 16px; }
.table-card { border-radius: 14px; }
.hash { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 12px; }
.review-summary { margin-bottom: 18px; }
@media (max-width: 760px) { .page-heading { flex-direction: column; } }
</style>
