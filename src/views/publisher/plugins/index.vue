<template>
  <div class="center-page">
    <header class="page-heading">
      <div>
        <el-tag size="small" effect="plain" round>{{ isAdminView ? "Admin Workspace" : "Publisher Workspace" }}</el-tag>
        <h1>{{ isAdminView ? "插件目录" : "插件" }}</h1>
        <p>{{ isAdminView ? "查看平台全部插件及其生命周期状态。" : "创建、编辑并跟踪当前发布者组织下的插件。" }}</p>
      </div>
      <div class="heading-actions">
        <el-button :loading="loading" @click="loadData">刷新</el-button>
        <el-button v-if="!isAdminView" type="primary" :disabled="verifiedNamespaces.length === 0" @click="openCreateDialog">
          创建插件
        </el-button>
      </div>
    </header>

    <el-alert
      v-if="!isAdminView && !loading && verifiedNamespaces.length === 0"
      title="需要先拥有已验证的命名空间，才能创建插件。"
      type="warning"
      show-icon
      :closable="false"
      class="data-alert"
    />
    <el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon :closable="false" class="data-alert" />

    <el-card shadow="never" class="table-card">
      <el-table v-loading="loading" :data="plugins" stripe>
        <el-table-column label="图标" width="72">
          <template #default="scope"><el-avatar shape="square" :size="38" :src="scope.row.icon_url || undefined">{{ scope.row.display_name?.[0] || "N" }}</el-avatar></template>
        </el-table-column>
        <el-table-column label="插件 ID" prop="plugin_id" min-width="220" />
        <el-table-column label="名称" prop="display_name" min-width="160" />
        <el-table-column label="双语资料" width="110">
          <template #default="scope"><el-tag :type="translationComplete(scope.row) ? 'success' : 'warning'">{{ translationComplete(scope.row) ? "完整" : "待补充" }}</el-tag></template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="scope"><el-tag :type="statusType(scope.row.status)" round>{{ statusLabel(scope.row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="可见性">
          <template #default="scope">{{ visibilityLabel(scope.row.visibility) }}</template>
        </el-table-column>
        <el-table-column label="当前版本" prop="current_version" />
        <el-table-column label="更新时间" min-width="180">
          <template #default="scope">{{ formatDate(scope.row.updated_at) }}</template>
        </el-table-column>
        <el-table-column v-if="!isAdminView" label="操作" width="100" fixed="right">
          <template #default="scope"><el-button link type="primary" @click="openEditDialog(scope.row)">编辑</el-button></template>
        </el-table-column>
        <template #empty><el-empty description="当前权限范围内暂无插件" /></template>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑插件' : '创建插件'" width="640px" destroy-on-close>
      <el-form label-position="top" @submit.prevent>
        <template v-if="!editingId">
          <el-form-item label="发布者组织" required>
            <el-select v-model="form.organizationId" style="width: 100%" @change="selectDefaultNamespace">
              <el-option v-for="organization in editableOrganizations" :key="organization.id" :label="organization.display_name" :value="organization.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="命名空间" required>
            <el-select v-model="form.namespaceId" style="width: 100%">
              <el-option v-for="item in organizationNamespaces" :key="item.id" :label="item.namespace" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="插件 ID" required>
            <el-input v-model="form.pluginId" :placeholder="pluginIdPlaceholder" />
            <div class="field-tip">必须以所选命名空间开头，创建后不可修改。</div>
          </el-form-item>
        </template>
        <el-tabs v-model="translationTab" class="translation-tabs">
          <el-tab-pane label="简体中文" name="zh-CN">
            <el-form-item label="插件名称" required><el-input v-model="form.translations['zh-CN'].displayName" maxlength="100" show-word-limit /></el-form-item>
            <el-form-item label="简短说明" required><el-input v-model="form.translations['zh-CN'].summary" maxlength="300" show-word-limit /></el-form-item>
            <el-form-item label="详细说明" required><el-input v-model="form.translations['zh-CN'].description" type="textarea" :rows="5" maxlength="20000" show-word-limit /></el-form-item>
          </el-tab-pane>
          <el-tab-pane label="English" name="en-US">
            <el-form-item label="Plugin name" required><el-input v-model="form.translations['en-US'].displayName" maxlength="100" show-word-limit /></el-form-item>
            <el-form-item label="Short summary" required><el-input v-model="form.translations['en-US'].summary" maxlength="300" show-word-limit /></el-form-item>
            <el-form-item label="Description" required><el-input v-model="form.translations['en-US'].description" type="textarea" :rows="5" maxlength="20000" show-word-limit /></el-form-item>
          </el-tab-pane>
        </el-tabs>
        <el-form-item label="市场图标">
          <div class="icon-editor">
            <el-avatar shape="square" :size="72" :src="iconPreview || undefined">{{ form.translations['zh-CN'].displayName?.[0] || 'N' }}</el-avatar>
            <div><input ref="iconInput" type="file" accept="image/png,image/jpeg,image/webp" @change="selectIcon" /><div class="field-tip">PNG / JPEG / WebP，最大 2 MiB。市场图标与包内 manifest.icon 相互独立。</div></div>
            <el-button v-if="editingId && currentIconUrl" type="danger" plain @click="removeIcon">删除图标</el-button>
          </div>
        </el-form-item>
        <el-form-item label="源码仓库">
          <el-input v-model="form.repositoryUrl" placeholder="https://github.com/..." />
        </el-form-item>
        <el-form-item label="主分类" required><el-select v-model="form.categoryId" style="width:100%"><el-option v-for="item in categoryOptions" :key="item.id" :label="item.label" :value="item.id" /></el-select></el-form-item>
        <el-form-item label="标签"><el-select v-model="form.tags" multiple filterable allow-create default-first-option style="width:100%" :multiple-limit="12" placeholder="最多12个标签"/></el-form-item>
        <el-form-item label="定价"><el-radio-group v-model="form.pricingModel"><el-radio value="free">免费</el-radio><el-radio value="one_time">一次性永久授权</el-radio></el-radio-group></el-form-item>
        <el-form-item v-if="form.pricingModel==='one_time'" label="价格（人民币）" required><el-input-number v-model="form.priceYuan" :min="1" :max="999" :precision="2"/><div class="field-tip">平台收取10%服务费，预计开发者收入 ¥{{ (form.priceYuan*0.9).toFixed(2) }}。</div></el-form-item>
        <el-alert title="开发者应自行依法申报并缴纳相关税费；平台服务费不包含开发者应承担的税费。" type="warning" show-icon :closable="false"/>
        <el-form-item label="市场可见性">
          <el-select v-model="form.visibility" style="width: 100%">
            <el-option label="公开" value="public" />
            <el-option label="不列出（持链接可见）" value="unlisted" />
            <el-option label="私有" value="private" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="savePlugin">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { useI18n } from "vue-i18n";
import { pluginCenterApi } from "@/api/pluginCenter";

interface PluginRow {
  id: string;
  organization_id: string;
  namespace_id: string;
  plugin_id: string;
  display_name: string;
  summary: string;
  description: string;
  icon_url?: string;
  translations?: Array<{ culture: string; display_name: string; summary: string; description: string }>;
  repository_url?: string;
  visibility: string;
  category_id: string;
  tags: string[];
  pricing_model: string;
  price_cents: number;
  status: string;
  current_version?: string;
  updated_at: string;
}

interface Organization { id: string; display_name: string; status: string; }
interface Membership { role: string; organization: Organization; }
interface NamespaceRow { id: string; organization_id: string; namespace: string; verified: boolean; }

const route = useRoute();
const { t } = useI18n();
const categoryOptions = computed(() => ["compatibility", "developer", "integration", "management", "ui", "utility"]
  .map(id => ({ id, label: t(`market.categories.${id}`) })));
const isAdminView = computed(() => route.path.startsWith("/admin/"));
const loading = ref(false);
const submitting = ref(false);
const errorMessage = ref("");
const dialogVisible = ref(false);
const editingId = ref("");
const translationTab = ref("zh-CN");
const selectedIcon = ref<File>();
const iconPreview = ref("");
const currentIconUrl = ref("");
const plugins = ref<PluginRow[]>([]);
const memberships = ref<Membership[]>([]);
const namespaces = ref<NamespaceRow[]>([]);
const form = reactive({
  organizationId: "",
  namespaceId: "",
  pluginId: "",
  translations: {
    "zh-CN": { displayName: "", summary: "", description: "" },
    "en-US": { displayName: "", summary: "", description: "" }
  },
  repositoryUrl: "",
  visibility: "public",
  categoryId: "utility",
  tags: [] as string[],
  pricingModel: "free",
  priceYuan: 0
});

const editableOrganizations = computed(() => memberships.value
  .filter(item => ["owner", "maintainer"].includes(item.role) && item.organization.status === "active")
  .map(item => item.organization));
const verifiedNamespaces = computed(() => namespaces.value.filter(item => item.verified));
const organizationNamespaces = computed(() => verifiedNamespaces.value.filter(item => item.organization_id === form.organizationId));
const pluginIdPlaceholder = computed(() => {
  const namespace = organizationNamespaces.value.find(item => item.id === form.namespaceId)?.namespace;
  return namespace ? `${namespace}.my-plugin` : "cn.example.my-plugin";
});

const loadData = async () => {
  loading.value = true;
  errorMessage.value = "";
  try {
    const [pluginRows, memberRows, namespaceRows] = await Promise.all([
      isAdminView.value ? pluginCenterApi.listAdminPlugins() : pluginCenterApi.listMyPlugins(),
      pluginCenterApi.listMyMemberships(),
      pluginCenterApi.listMyNamespaces()
    ]);
    plugins.value = pluginRows as PluginRow[];
    memberships.value = memberRows as unknown as Membership[];
    namespaces.value = namespaceRows as NamespaceRow[];
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "加载失败";
    plugins.value = [];
    if (!isAdminView.value) {
      memberships.value = [];
      namespaces.value = [];
    }
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  editingId.value = "";
  form.organizationId = editableOrganizations.value[0]?.id ?? "";
  form.namespaceId = verifiedNamespaces.value.find(item => item.organization_id === form.organizationId)?.id ?? "";
  form.pluginId = "";
  for (const culture of ["zh-CN", "en-US"] as const) {
    form.translations[culture].displayName = "";
    form.translations[culture].summary = "";
    form.translations[culture].description = "";
  }
  selectedIcon.value = undefined;
  iconPreview.value = "";
  currentIconUrl.value = "";
  translationTab.value = "zh-CN";
  form.repositoryUrl = "";
  form.visibility = "public";
  form.categoryId = "utility";
  form.tags = [];
  form.pricingModel = "free";
  form.priceYuan = 0;
};

const selectDefaultNamespace = () => {
  form.namespaceId = organizationNamespaces.value[0]?.id ?? "";
};

const openCreateDialog = () => {
  resetForm();
  dialogVisible.value = true;
};

const openEditDialog = (row: PluginRow) => {
  editingId.value = row.id;
  for (const culture of ["zh-CN", "en-US"] as const) {
    const translation = row.translations?.find(item => item.culture === culture);
    form.translations[culture].displayName = translation?.display_name ?? (culture === "zh-CN" ? row.display_name : "");
    form.translations[culture].summary = translation?.summary ?? (culture === "zh-CN" ? row.summary : "");
    form.translations[culture].description = translation?.description ?? (culture === "zh-CN" ? row.description : "");
  }
  selectedIcon.value = undefined;
  currentIconUrl.value = row.icon_url ?? "";
  iconPreview.value = currentIconUrl.value;
  form.repositoryUrl = row.repository_url ?? "";
  form.visibility = row.visibility;
  form.categoryId = row.category_id || "utility";
  form.tags = row.tags ?? [];
  form.pricingModel = row.pricing_model || "free";
  form.priceYuan = (row.price_cents ?? 0) / 100;
  dialogVisible.value = true;
};

const selectIcon = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  if (!(["image/png", "image/jpeg", "image/webp"].includes(file.type)) || file.size > 2 * 1024 * 1024) {
    ElMessage.warning("图标必须是 PNG、JPEG 或 WebP，且不超过 2 MiB");
    return;
  }
  selectedIcon.value = file;
  if (iconPreview.value.startsWith("blob:")) URL.revokeObjectURL(iconPreview.value);
  iconPreview.value = URL.createObjectURL(file);
};
const removeIcon = async () => {
  if (!editingId.value) return;
  await pluginCenterApi.removePluginIcon(editingId.value);
  currentIconUrl.value = "";
  iconPreview.value = "";
  selectedIcon.value = undefined;
  ElMessage.success("市场图标已删除");
};
const translationComplete = (row: PluginRow) => ["zh-CN", "en-US"].every(culture => {
  const translation = row.translations?.find(item => item.culture === culture);
  return Boolean(translation?.display_name?.trim() && translation.summary?.trim() && translation.description?.trim());
});

const savePlugin = async () => {
  const translations = {
    "zh-CN": { ...form.translations["zh-CN"] },
    "en-US": { ...form.translations["en-US"] }
  };
  const complete = Object.values(translations).every(item => item.displayName.trim() && item.summary.trim() && item.description.trim());
  if (!complete || (!editingId.value && (!form.organizationId || !form.namespaceId || !form.pluginId.trim()))) {
    ElMessage.warning("请完整填写必填项");
    return;
  }
  submitting.value = true;
  try {
    const common = {
      translations,
      repositoryUrl: form.repositoryUrl.trim() || undefined,
      visibility: form.visibility
    };
    let targetId = editingId.value;
    if (editingId.value) {
      await pluginCenterApi.updatePlugin(editingId.value, common);
      ElMessage.success("插件信息已更新");
    } else {
      const created = await pluginCenterApi.createPlugin({
        ...common,
        organizationId: form.organizationId,
        namespaceId: form.namespaceId,
        pluginId: form.pluginId.trim().toLowerCase()
      });
      targetId = String(created.id ?? "");
      ElMessage.success("插件草稿已创建");
    }
    if (targetId) {
      if (selectedIcon.value) await pluginCenterApi.uploadPluginIcon(targetId, selectedIcon.value);
      await pluginCenterApi.setMarketMetadata(targetId, {
        categoryId: form.categoryId,
        tags: form.tags.map(item => item.trim()).filter(Boolean),
        pricingModel: form.pricingModel,
        priceCents: form.pricingModel === "free" ? 0 : Math.round(form.priceYuan * 100)
      });
    }
    dialogVisible.value = false;
    await loadData();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "保存插件失败");
  } finally {
    submitting.value = false;
  }
};

const statusLabel = (status: string) => ({
  draft: "草稿", in_review: "审核中", published: "已发布", suspended: "已停用", archived: "已归档"
})[status] ?? status;
const statusType = (status: string): "success" | "warning" | "danger" | "info" => {
  if (status === "published") return "success";
  if (["suspended", "archived"].includes(status)) return "danger";
  if (status === "in_review") return "warning";
  return "info";
};
const visibilityLabel = (visibility: string) => ({ public: "公开", unlisted: "不列出", private: "私有" })[visibility] ?? visibility;
const formatDate = (value: string) => new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

onMounted(loadData);
</script>

<style scoped lang="scss">
.center-page { padding: 4px; }
.page-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-bottom: 22px; }
.page-heading h1 { margin: 10px 0 8px; font-size: 26px; }
.page-heading p { margin: 0; line-height: 1.7; color: var(--el-text-color-secondary); }
.heading-actions { display: flex; gap: 10px; }
.data-alert { margin-bottom: 16px; }
.table-card { border-radius: 14px; }
.field-tip { margin-top: 6px; color: var(--el-text-color-secondary); font-size: 12px; }
.icon-editor { width: 100%; display: flex; align-items: center; gap: 16px; }
.icon-editor input { max-width: 260px; }
.translation-tabs { width: 100%; }
@media (max-width: 760px) {
  .page-heading { flex-direction: column; }
}
</style>
