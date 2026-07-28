<template>
  <div class="center-page">
    <header class="page-heading">
      <div>
        <el-tag size="small" effect="plain" round>Admin Workspace</el-tag>
        <h1>启动器公告</h1>
        <p>发布后由桌面端启动时拉取。支持多语言 Markdown、渠道/平台过滤与版本范围。</p>
      </div>
      <div class="heading-actions">
        <el-button :loading="loading" @click="load">刷新</el-button>
        <el-button type="primary" @click="openCreate">发布公告</el-button>
      </div>
    </header>

    <el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon :closable="false" class="data-alert" />

    <el-card shadow="never" class="table-card">
      <el-table v-loading="loading" :data="announcements" stripe>
        <el-table-column label="ID" prop="id" min-width="160" />
        <el-table-column label="标题" min-width="200">
          <template #default="scope">{{ titleOf(scope.row) }}</template>
        </el-table-column>
        <el-table-column label="级别" width="110">
          <template #default="scope">
            <el-tag :type="severityType(scope.row.severity)" round>{{ severityLabel(scope.row.severity) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.enabled ? 'success' : 'info'" round>
              {{ scope.row.enabled ? "已启用" : "已停用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="优先级" prop="priority" width="90" />
        <el-table-column label="开始" min-width="170">
          <template #default="scope">{{ formatDate(scope.row.starts_at) }}</template>
        </el-table-column>
        <el-table-column label="结束" min-width="170">
          <template #default="scope">{{ scope.row.ends_at ? formatDate(scope.row.ends_at) : "无限期" }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="openEdit(scope.row)">编辑</el-button>
            <el-button
              link
              :type="scope.row.enabled ? 'warning' : 'success'"
              :loading="actingId === scope.row.id"
              @click="toggleEnabled(scope.row)"
            >{{ scope.row.enabled ? "停用" : "启用" }}</el-button>
            <el-button link type="danger" :loading="actingId === scope.row.id" @click="remove(scope.row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无公告" /></template>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑公告' : '发布公告'" width="720px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item label="公告 ID" required>
          <el-input
            v-model="form.id"
            :disabled="Boolean(editingId)"
            placeholder="例如 release-1-3-9 或 security-2026-07"
          />
        </el-form-item>
        <div class="form-grid">
          <el-form-item label="级别" required>
            <el-select v-model="form.severity" style="width: 100%">
              <el-option label="普通 (info)" value="info" />
              <el-option label="重要 (important)" value="important" />
              <el-option label="安全 (security)" value="security" />
            </el-select>
          </el-form-item>
          <el-form-item label="优先级">
            <el-input-number v-model="form.priority" :min="-1000" :max="1000" style="width: 100%" />
          </el-form-item>
        </div>
        <div class="form-grid">
          <el-form-item label="启用">
            <el-switch v-model="form.enabled" />
          </el-form-item>
          <el-form-item label="可关闭">
            <el-switch v-model="form.dismissible" />
          </el-form-item>
        </div>
        <div class="form-grid">
          <el-form-item label="开始时间">
            <el-date-picker
              v-model="form.startsAt"
              type="datetime"
              value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="结束时间（可选）">
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
          <el-form-item label="最低版本（可选）">
            <el-input v-model="form.minimumVersion" placeholder="如 1.3.0" clearable />
          </el-form-item>
          <el-form-item label="最高版本（不含，可选）">
            <el-input v-model="form.maximumVersionExclusive" placeholder="如 2.0.0" clearable />
          </el-form-item>
        </div>
        <el-form-item label="渠道过滤（逗号分隔，空=全部）">
          <el-input v-model="form.channelsText" placeholder="stable,beta" clearable />
        </el-form-item>
        <el-form-item label="平台过滤（逗号分隔，空=全部）">
          <el-input v-model="form.platformsText" placeholder="windows,linux,macos" clearable />
        </el-form-item>
        <el-divider content-position="left">中文内容 (zh-CN)</el-divider>
        <el-form-item label="标题" required>
          <el-input v-model="form.zhTitle" />
        </el-form-item>
        <el-form-item label="正文 Markdown" required>
          <el-input v-model="form.zhBody" type="textarea" :rows="8" placeholder="支持 Markdown" />
        </el-form-item>
        <div class="form-grid">
          <el-form-item label="主按钮文案">
            <el-input v-model="form.zhPrimaryLabel" placeholder="知道了" />
          </el-form-item>
          <el-form-item label="操作按钮文案">
            <el-input v-model="form.zhActionLabel" placeholder="查看详情" clearable />
          </el-form-item>
        </div>
        <el-form-item label="操作链接">
          <el-input v-model="form.zhActionUrl" placeholder="https://..." clearable />
        </el-form-item>
        <el-divider content-position="left">英文内容 (en-US，可选)</el-divider>
        <el-form-item label="Title">
          <el-input v-model="form.enTitle" clearable />
        </el-form-item>
        <el-form-item label="Body Markdown">
          <el-input v-model="form.enBody" type="textarea" :rows="5" clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
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
  enBody: ""
});

const severityLabel = (value: string) =>
  ({ info: "普通", important: "重要", security: "安全" } as Record<string, string>)[value] ?? value;
const severityType = (value: string): "info" | "warning" | "danger" => {
  if (value === "security") return "danger";
  if (value === "important") return "warning";
  return "info";
};
const formatDate = (value: string) =>
  value
    ? new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
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
    announcements.value = (data.announcements ?? []) as AnnouncementRow[];
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "加载失败";
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
  dialogVisible.value = true;
};

const parseList = (text: string) =>
  text.split(/[,，\s]+/).map(item => item.trim()).filter(Boolean);

const save = async () => {
  if (!form.id.trim() || !form.zhTitle.trim() || !form.zhBody.trim()) {
    ElMessage.warning("请填写 ID、中文标题与正文");
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
      primaryLabel: "OK",
      actionLabel: form.zhActionLabel.trim() || undefined,
      actionUrl: form.zhActionUrl.trim() || undefined
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
    ElMessage.success("公告已保存");
    dialogVisible.value = false;
    await load();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "保存失败");
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
    ElMessage.success(row.enabled ? "已停用" : "已启用");
    await load();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "操作失败");
  } finally {
    actingId.value = "";
  }
};

const remove = async (row: AnnouncementRow) => {
  try {
    await ElMessageBox.confirm(`确定删除公告「${titleOf(row)}」？`, "删除公告", { type: "warning" });
  } catch {
    return;
  }
  actingId.value = row.id;
  try {
    await pluginCenterApi.deleteAdminAnnouncement(row.id);
    ElMessage.success("已删除");
    await load();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "删除失败");
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
@media (max-width: 720px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
