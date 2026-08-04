<template>
  <div class="center-page">
    <header class="page-heading">
      <div>
        <el-tag size="small" effect="plain" round>{{ t("admin.workspace") }}</el-tag>
        <h1>{{ t("admin.announcements.title") }}</h1>
        <p>{{ t("admin.announcements.description") }}</p>
      </div>
      <div class="heading-actions">
        <el-button :loading="loading" @click="load">{{ t("admin.refresh") }}</el-button>
        <el-button type="primary" @click="openCreate">{{ t("admin.announcements.publish") }}</el-button>
      </div>
    </header>

    <el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon :closable="false" class="data-alert" />

    <el-card shadow="never" class="table-card">
      <el-table v-loading="loading" :data="announcements" stripe>
        <el-table-column :label="t('admin.announcements.id')" prop="id" min-width="160" />
        <el-table-column :label="t('admin.announcements.headline')" min-width="200">
          <template #default="scope">{{ titleOf(scope.row) }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.announcements.severity')" width="110">
          <template #default="scope">
            <el-tag :type="severityType(scope.row.severity)" round>{{ severityLabel(scope.row.severity) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.announcements.status')" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.enabled ? 'success' : 'info'" round>
              {{ scope.row.enabled ? t("admin.announcements.enabled") : t("admin.announcements.disabled") }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.announcements.priority')" prop="priority" width="90" />
        <el-table-column :label="t('admin.announcements.starts')" min-width="170">
          <template #default="scope">{{ formatDate(scope.row.starts_at) }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.announcements.ends')" min-width="170">
          <template #default="scope">{{ scope.row.ends_at ? formatDate(scope.row.ends_at) : t("admin.announcements.indefinite") }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.actions')" width="180" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="openEdit(scope.row)">{{ t("admin.announcements.edit") }}</el-button>
            <el-button
              link
              :type="scope.row.enabled ? 'warning' : 'success'"
              :loading="actingId === scope.row.id"
              @click="toggleEnabled(scope.row)"
            >{{ scope.row.enabled ? t("admin.announcements.disable") : t("admin.announcements.enable") }}</el-button>
            <el-button link type="danger" :loading="actingId === scope.row.id" @click="remove(scope.row)">{{ t("admin.announcements.remove") }}</el-button>
          </template>
        </el-table-column>
        <template #empty><el-empty :description="t('admin.announcements.empty')" /></template>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? t('admin.announcements.editTitle') : t('admin.announcements.createTitle')"
      width="720px"
      destroy-on-close
    >
      <el-form label-position="top">
        <el-form-item :label="t('admin.announcements.announcementId')" required>
          <el-input
            v-model="form.id"
            :disabled="Boolean(editingId)"
            placeholder="release-1-3-9 / security-2026-07"
          />
        </el-form-item>
        <div class="form-grid">
          <el-form-item :label="t('admin.announcements.severity')" required>
            <el-select v-model="form.severity" style="width: 100%">
              <el-option :label="t('admin.announcements.severityInfo')" value="info" />
              <el-option :label="t('admin.announcements.severityImportant')" value="important" />
              <el-option :label="t('admin.announcements.severitySecurity')" value="security" />
            </el-select>
          </el-form-item>
          <el-form-item :label="t('admin.announcements.priority')">
            <el-input-number v-model="form.priority" :min="-1000" :max="1000" style="width: 100%" />
          </el-form-item>
        </div>
        <div class="form-grid">
          <el-form-item :label="t('admin.announcements.enable')">
            <el-switch v-model="form.enabled" />
          </el-form-item>
          <el-form-item :label="t('admin.announcements.dismissible')">
            <el-switch v-model="form.dismissible" />
          </el-form-item>
        </div>
        <div class="form-grid">
          <el-form-item :label="t('admin.announcements.startsAt')">
            <el-date-picker
              v-model="form.startsAt"
              type="datetime"
              value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item :label="t('admin.announcements.endsAt')">
            <el-date-picker
              v-model="form.endsAt"
              type="datetime"
              value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
              style="width: 100%"
              clearable
            />
          </el-form-item>
        </div>
        <div class="form-grid">
          <el-form-item :label="t('admin.announcements.minVersion')">
            <el-input v-model="form.minimumVersion" placeholder="1.3.0" clearable />
          </el-form-item>
          <el-form-item :label="t('admin.announcements.maxVersion')">
            <el-input v-model="form.maximumVersionExclusive" placeholder="2.0.0" clearable />
          </el-form-item>
        </div>
        <el-form-item :label="t('admin.announcements.channels')">
          <el-input v-model="form.channelsText" placeholder="stable,beta" clearable />
        </el-form-item>
        <el-form-item :label="t('admin.announcements.platforms')">
          <el-input v-model="form.platformsText" placeholder="windows,linux,macos" clearable />
        </el-form-item>
        <el-divider content-position="left">{{ t("admin.announcements.zhContent") }}</el-divider>
        <el-form-item :label="t('admin.announcements.headline')" required>
          <el-input v-model="form.zhTitle" />
        </el-form-item>
        <el-form-item :label="t('admin.announcements.bodyMd')" required>
          <el-input v-model="form.zhBody" type="textarea" :rows="8" />
        </el-form-item>
        <div class="form-grid">
          <el-form-item :label="t('admin.announcements.primaryLabel')">
            <el-input v-model="form.zhPrimaryLabel" />
          </el-form-item>
          <el-form-item :label="t('admin.announcements.actionLabel')">
            <el-input v-model="form.zhActionLabel" clearable />
          </el-form-item>
        </div>
        <el-form-item :label="t('admin.announcements.actionUrl')">
          <el-input v-model="form.zhActionUrl" placeholder="https://..." clearable />
        </el-form-item>
        <el-divider content-position="left">{{ t("admin.announcements.enContent") }}</el-divider>
        <el-form-item label="Title">
          <el-input v-model="form.enTitle" clearable />
        </el-form-item>
        <el-form-item label="Body Markdown">
          <el-input v-model="form.enBody" type="textarea" :rows="5" clearable />
        </el-form-item>
        <div class="form-grid">
          <el-form-item label="Primary button label">
            <el-input v-model="form.enPrimaryLabel" placeholder="OK" clearable />
          </el-form-item>
          <el-form-item label="Action button label">
            <el-input v-model="form.enActionLabel" placeholder="Learn more" clearable />
          </el-form-item>
        </div>
        <el-form-item label="Action URL">
          <el-input v-model="form.enActionUrl" placeholder="https://..." clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t("admin.cancel") }}</el-button>
        <el-button type="primary" :loading="saving" @click="save">{{ t("admin.announcements.save") }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage, ElMessageBox } from "element-plus";
import { pluginCenterApi } from "@/api/pluginCenter";

interface AnnouncementRow {
  id: string;
  enabled: boolean;
  severity: string;
  priority: number;
  starts_at: string;
  ends_at: string | null;
  minimum_version: string | null;
  maximum_version_exclusive: string | null;
  channels: string[];
  platforms: string[];
  localized_content: Record<string, {
    title?: string;
    body?: string;
    primaryLabel?: string;
    actionLabel?: string;
    actionUrl?: string;
  }>;
  dismissible: boolean;
  updated_at: string;
}

const { t, locale } = useI18n();
const loading = ref(false);
const saving = ref(false);
const actingId = ref("");
const errorMessage = ref("");
const announcements = ref<AnnouncementRow[]>([]);
const dialogVisible = ref(false);
const editingId = ref("");

const form = reactive({
  id: "",
  enabled: true,
  severity: "info" as "info" | "important" | "security",
  priority: 0,
  dismissible: true,
  startsAt: new Date().toISOString(),
  endsAt: "" as string | null,
  minimumVersion: "",
  maximumVersionExclusive: "",
  channelsText: "",
  platformsText: "",
  zhTitle: "",
  zhBody: "",
  zhPrimaryLabel: "知道了",
  zhActionLabel: "",
  zhActionUrl: "",
  enTitle: "",
  enBody: "",
  enPrimaryLabel: "OK",
  enActionLabel: "",
  enActionUrl: ""
});

const severityLabel = (value: string) =>
  ({
    info: t("admin.announcements.severityInfoShort"),
    important: t("admin.announcements.severityImportantShort"),
    security: t("admin.announcements.severitySecurityShort")
  } as Record<string, string>)[value] ?? value;
const severityType = (value: string): "info" | "warning" | "danger" => {
  if (value === "security") return "danger";
  if (value === "important") return "warning";
  return "info";
};
const formatDate = (value: string) =>
  value
    ? new Intl.DateTimeFormat(locale.value === "zh" ? "zh-CN" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(value))
    : "—";
const titleOf = (row: AnnouncementRow) =>
  row.localized_content?.["zh-CN"]?.title
  || row.localized_content?.["en-US"]?.title
  || row.id;

const load = async () => {
  loading.value = true;
  errorMessage.value = "";
  try {
    const data = await pluginCenterApi.listAdminAnnouncements();
    announcements.value = (data.announcements ?? []) as unknown as AnnouncementRow[];
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t("admin.announcements.loadFailed");
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  editingId.value = "";
  form.id = "";
  form.enabled = true;
  form.severity = "info";
  form.priority = 0;
  form.dismissible = true;
  form.startsAt = new Date().toISOString();
  form.endsAt = "";
  form.minimumVersion = "";
  form.maximumVersionExclusive = "";
  form.channelsText = "";
  form.platformsText = "";
  form.zhTitle = "";
  form.zhBody = "";
  form.zhPrimaryLabel = "知道了";
  form.zhActionLabel = "";
  form.zhActionUrl = "";
  form.enTitle = "";
  form.enBody = "";
  form.enPrimaryLabel = "OK";
  form.enActionLabel = "";
  form.enActionUrl = "";
};

const openCreate = () => {
  resetForm();
  dialogVisible.value = true;
};

const openEdit = (row: AnnouncementRow) => {
  editingId.value = row.id;
  form.id = row.id;
  form.enabled = row.enabled;
  form.severity = (row.severity as "info" | "important" | "security") || "info";
  form.priority = row.priority ?? 0;
  form.dismissible = row.dismissible !== false;
  form.startsAt = row.starts_at;
  form.endsAt = row.ends_at ?? "";
  form.minimumVersion = row.minimum_version ?? "";
  form.maximumVersionExclusive = row.maximum_version_exclusive ?? "";
  form.channelsText = (row.channels ?? []).join(",");
  form.platformsText = (row.platforms ?? []).join(",");
  const zh = row.localized_content?.["zh-CN"] ?? {};
  const en = row.localized_content?.["en-US"] ?? {};
  form.zhTitle = zh.title ?? "";
  form.zhBody = zh.body ?? "";
  form.zhPrimaryLabel = zh.primaryLabel ?? "知道了";
  form.zhActionLabel = zh.actionLabel ?? "";
  form.zhActionUrl = zh.actionUrl ?? "";
  form.enTitle = en.title ?? "";
  form.enBody = en.body ?? "";
  form.enPrimaryLabel = en.primaryLabel ?? "OK";
  form.enActionLabel = en.actionLabel ?? "";
  form.enActionUrl = en.actionUrl ?? "";
  dialogVisible.value = true;
};

const parseList = (text: string) =>
  text.split(/[,，\s]+/).map(item => item.trim()).filter(Boolean);

const save = async () => {
  if (!form.id.trim() || !form.zhTitle.trim() || !form.zhBody.trim()) {
    ElMessage.warning(t("admin.announcements.loadFailed"));
    return;
  }
  const localizedContent: Record<string, {
    title: string;
    body: string;
    primaryLabel?: string;
    actionLabel?: string;
    actionUrl?: string;
  }> = {
    "zh-CN": {
      title: form.zhTitle.trim(),
      body: form.zhBody.trim(),
      primaryLabel: form.zhPrimaryLabel.trim() || "知道了",
      actionLabel: form.zhActionLabel.trim() || undefined,
      actionUrl: form.zhActionUrl.trim() || undefined
    }
  };
  if (form.enTitle.trim() && form.enBody.trim()) {
    localizedContent["en-US"] = {
      title: form.enTitle.trim(),
      body: form.enBody.trim(),
      primaryLabel: form.enPrimaryLabel.trim() || "OK",
      actionLabel: form.enActionLabel.trim() || undefined,
      actionUrl: form.enActionUrl.trim() || undefined
    };
  }

  saving.value = true;
  try {
    await pluginCenterApi.upsertAdminAnnouncement({
      id: form.id.trim().toLowerCase(),
      enabled: form.enabled,
      severity: form.severity,
      priority: form.priority,
      startsAt: form.startsAt || new Date().toISOString(),
      endsAt: form.endsAt || null,
      minimumVersion: form.minimumVersion.trim() || null,
      maximumVersionExclusive: form.maximumVersionExclusive.trim() || null,
      channels: parseList(form.channelsText),
      platforms: parseList(form.platformsText),
      dismissible: form.dismissible,
      localizedContent
    });
    ElMessage.success(t("admin.announcements.saved"));
    dialogVisible.value = false;
    await load();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t("admin.announcements.saveFailed"));
  } finally {
    saving.value = false;
  }
};

const toggleEnabled = async (row: AnnouncementRow) => {
  actingId.value = row.id;
  try {
    const zh = row.localized_content?.["zh-CN"] ?? { title: row.id, body: "" };
    await pluginCenterApi.upsertAdminAnnouncement({
      id: row.id,
      enabled: !row.enabled,
      severity: (row.severity as "info" | "important" | "security") || "info",
      priority: row.priority ?? 0,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      minimumVersion: row.minimum_version,
      maximumVersionExclusive: row.maximum_version_exclusive,
      channels: row.channels ?? [],
      platforms: row.platforms ?? [],
      dismissible: row.dismissible !== false,
      localizedContent: {
        "zh-CN": {
          title: zh.title || row.id,
          body: zh.body || "",
          primaryLabel: zh.primaryLabel,
          actionLabel: zh.actionLabel,
          actionUrl: zh.actionUrl
        },
        ...(row.localized_content?.["en-US"]
          ? { "en-US": row.localized_content["en-US"] as any }
          : {})
      }
    });
    ElMessage.success(row.enabled ? t("admin.announcements.disabledOk") : t("admin.announcements.enabledOk"));
    await load();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t("admin.announcements.toggleFailed"));
  } finally {
    actingId.value = "";
  }
};

const remove = async (row: AnnouncementRow) => {
  try {
    await ElMessageBox.confirm(
      t("admin.announcements.deleteConfirm", { id: titleOf(row) }),
      t("admin.announcements.remove"),
      { type: "warning" }
    );
  } catch {
    return;
  }
  actingId.value = row.id;
  try {
    await pluginCenterApi.deleteAdminAnnouncement(row.id);
    ElMessage.success(t("admin.announcements.deleted"));
    await load();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t("admin.announcements.deleteFailed"));
  } finally {
    actingId.value = "";
  }
};

onMounted(load);
</script>

<style scoped>
.center-page {
  padding: 4px;
}
.page-heading {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 22px;
}
.page-heading h1 {
  margin: 8px 0 6px;
  font-size: 28px;
  color: var(--el-text-color-primary);
}
.page-heading p {
  margin: 0;
  color: var(--el-text-color-secondary);
  max-width: 720px;
  line-height: 1.6;
}
.heading-actions {
  display: flex;
  gap: 10px;
}
.data-alert {
  margin-bottom: 16px;
}
.table-card {
  border-radius: 16px;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 16px;
}
@media (max-width: 640px) {
  .page-heading { flex-direction: column; }
  .form-grid { grid-template-columns: 1fr; }
}
</style>
