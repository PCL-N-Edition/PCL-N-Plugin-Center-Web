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
        <el-table-column label="插件 ID" prop="plugin_id" min-width="240" />
        <el-table-column label="名称" prop="display_name" min-width="180" />
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
        <el-form-item label="插件名称" required>
          <el-input v-model="form.displayName" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="简短说明">
          <el-input v-model="form.summary" maxlength="300" show-word-limit />
        </el-form-item>
        <el-form-item label="详细说明">
          <el-input v-model="form.description" type="textarea" :rows="5" />
        </el-form-item>
        <el-form-item label="源码仓库">
          <el-input v-model="form.repositoryUrl" placeholder="https://github.com/..." />
        </el-form-item>
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
import { pluginCenterApi } from "@/api/pluginCenter";
import { supabase } from "@/lib/supabase";

interface PluginRow {
  id: string;
  organization_id: string;
  namespace_id: string;
  plugin_id: string;
  display_name: string;
  summary: string;
  description: string;
  repository_url?: string;
  visibility: string;
  status: string;
  current_version?: string;
  updated_at: string;
}

interface Organization { id: string; display_name: string; status: string; }
interface Membership { role: string; organization: Organization; }
interface NamespaceRow { id: string; organization_id: string; namespace: string; verified: boolean; }

const route = useRoute();
const isAdminView = computed(() => route.path.startsWith("/admin/"));
const loading = ref(false);
const submitting = ref(false);
const errorMessage = ref("");
const dialogVisible = ref(false);
const editingId = ref("");
const plugins = ref<PluginRow[]>([]);
const memberships = ref<Membership[]>([]);
const namespaces = ref<NamespaceRow[]>([]);
const form = reactive({
  organizationId: "",
  namespaceId: "",
  pluginId: "",
  displayName: "",
  summary: "",
  description: "",
  repositoryUrl: "",
  visibility: "public"
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
  const [pluginResult, memberResult, namespaceResult] = await Promise.all([
    supabase.from("plugin_center_plugins").select("*").order("updated_at", { ascending: false }),
    supabase.from("plugin_center_publisher_members")
      .select("role, organization:plugin_center_publisher_organizations(id, display_name, status)"),
    supabase.from("plugin_center_namespaces").select("id, organization_id, namespace, verified")
  ]);
  const error = pluginResult.error ?? memberResult.error ?? namespaceResult.error;
  if (error) errorMessage.value = error.message;
  plugins.value = (pluginResult.data ?? []) as PluginRow[];
  memberships.value = (memberResult.data ?? []) as unknown as Membership[];
  namespaces.value = (namespaceResult.data ?? []) as NamespaceRow[];
  loading.value = false;
};

const resetForm = () => {
  editingId.value = "";
  form.organizationId = editableOrganizations.value[0]?.id ?? "";
  form.namespaceId = verifiedNamespaces.value.find(item => item.organization_id === form.organizationId)?.id ?? "";
  form.pluginId = "";
  form.displayName = "";
  form.summary = "";
  form.description = "";
  form.repositoryUrl = "";
  form.visibility = "public";
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
  form.displayName = row.display_name;
  form.summary = row.summary;
  form.description = row.description;
  form.repositoryUrl = row.repository_url ?? "";
  form.visibility = row.visibility;
  dialogVisible.value = true;
};

const savePlugin = async () => {
  if (!form.displayName.trim() || (!editingId.value && (!form.organizationId || !form.namespaceId || !form.pluginId.trim()))) {
    ElMessage.warning("请完整填写必填项");
    return;
  }
  submitting.value = true;
  try {
    const common = {
      displayName: form.displayName.trim(),
      summary: form.summary.trim(),
      description: form.description,
      repositoryUrl: form.repositoryUrl.trim() || undefined,
      visibility: form.visibility
    };
    if (editingId.value) {
      await pluginCenterApi.updatePlugin(editingId.value, common);
      ElMessage.success("插件信息已更新");
    } else {
      await pluginCenterApi.createPlugin({
        ...common,
        organizationId: form.organizationId,
        namespaceId: form.namespaceId,
        pluginId: form.pluginId.trim().toLowerCase()
      });
      ElMessage.success("插件草稿已创建");
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
@media (max-width: 760px) {
  .page-heading { flex-direction: column; }
}
</style>
