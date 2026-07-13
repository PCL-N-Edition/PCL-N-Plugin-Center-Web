<template>
  <div class="center-page">
    <header class="page-heading">
      <div>
        <el-tag size="small" effect="plain" round>Admin Workspace</el-tag>
        <h1>发布者治理</h1>
        <p>验证命名空间，并在出现风险时暂停或恢复发布者组织。所有更改都会写入审计日志。</p>
      </div>
      <el-button :loading="loading" @click="loadData">刷新</el-button>
    </header>

    <el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon :closable="false" class="data-alert" />
    <el-card shadow="never" class="table-card">
      <template #header><strong>发布者组织</strong></template>
      <el-table v-loading="loading" :data="organizations" stripe>
        <el-table-column label="组织" prop="display_name" min-width="200" />
        <el-table-column label="Slug" prop="slug" min-width="180" />
        <el-table-column label="状态">
          <template #default="scope"><el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'" round>{{ scope.row.status === "active" ? "正常" : "已停用" }}</el-tag></template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="180"><template #default="scope">{{ formatDate(scope.row.created_at) }}</template></el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button
              link
              :type="scope.row.status === 'active' ? 'danger' : 'success'"
              :loading="actingId === scope.row.id"
              @click="toggleOrganization(scope.row)"
            >{{ scope.row.status === "active" ? "暂停" : "恢复" }}</el-button>
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无发布者组织" /></template>
      </el-table>
    </el-card>

    <el-card shadow="never" class="table-card section-card">
      <template #header><strong>命名空间申请</strong></template>
      <el-table v-loading="loading" :data="namespaces" stripe>
        <el-table-column label="命名空间" prop="namespace" min-width="240" />
        <el-table-column label="组织" prop="organization.display_name" min-width="180" />
        <el-table-column label="状态">
          <template #default="scope"><el-tag :type="scope.row.verified ? 'success' : 'warning'" round>{{ scope.row.verified ? "已验证" : "待验证" }}</el-tag></template>
        </el-table-column>
        <el-table-column label="申请时间" min-width="180"><template #default="scope">{{ formatDate(scope.row.created_at) }}</template></el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button
              link
              :type="scope.row.verified ? 'danger' : 'primary'"
              :loading="actingId === scope.row.id"
              @click="toggleNamespace(scope.row)"
            >{{ scope.row.verified ? "撤销验证" : "验证通过" }}</el-button>
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无命名空间申请" /></template>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { pluginCenterApi } from "@/api/pluginCenter";
import { supabase } from "@/lib/supabase";

interface Organization { id: string; display_name: string; slug: string; status: string; created_at: string; }
interface NamespaceRow { id: string; namespace: string; verified: boolean; created_at: string; organization: Organization; }

const loading = ref(false);
const errorMessage = ref("");
const actingId = ref("");
const organizations = ref<Organization[]>([]);
const namespaces = ref<NamespaceRow[]>([]);

const loadData = async () => {
  loading.value = true;
  errorMessage.value = "";
  const [organizationResult, namespaceResult] = await Promise.all([
    supabase.from("plugin_center_publisher_organizations").select("*").order("created_at", { ascending: false }),
    supabase.from("plugin_center_namespaces")
      .select("id, namespace, verified, created_at, organization:plugin_center_publisher_organizations(id, display_name, slug, status, created_at)")
      .order("created_at", { ascending: false })
  ]);
  const error = organizationResult.error ?? namespaceResult.error;
  if (error) errorMessage.value = error.message;
  organizations.value = (organizationResult.data ?? []) as Organization[];
  namespaces.value = (namespaceResult.data ?? []) as unknown as NamespaceRow[];
  loading.value = false;
};

const toggleOrganization = async (row: Organization) => {
  const nextStatus = row.status === "active" ? "suspended" : "active";
  await ElMessageBox.confirm(
    nextStatus === "suspended" ? "暂停后该组织不能再执行发布写入，确定继续？" : "确定恢复该发布者组织？",
    "发布者状态确认",
    { type: "warning" }
  );
  actingId.value = row.id;
  try {
    await pluginCenterApi.setOrganizationStatus(row.id, nextStatus);
    ElMessage.success(nextStatus === "active" ? "组织已恢复" : "组织已暂停");
    await loadData();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "更新组织状态失败");
  } finally {
    actingId.value = "";
  }
};

const toggleNamespace = async (row: NamespaceRow) => {
  const nextVerified = !row.verified;
  await ElMessageBox.confirm(
    nextVerified ? `确认组织 ${row.organization.display_name} 拥有命名空间 ${row.namespace}？` : "撤销后将阻止新版本上传，确定继续？",
    "命名空间验证",
    { type: "warning" }
  );
  actingId.value = row.id;
  try {
    await pluginCenterApi.verifyNamespace(row.id, nextVerified);
    ElMessage.success(nextVerified ? "命名空间已验证" : "命名空间验证已撤销");
    await loadData();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "更新验证状态失败");
  } finally {
    actingId.value = "";
  }
};

const formatDate = (value: string) => new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

onMounted(loadData);
</script>

<style scoped lang="scss">
.center-page { padding: 4px; }
.page-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-bottom: 22px; }
.page-heading h1 { margin: 10px 0 8px; font-size: 26px; }
.page-heading p { margin: 0; line-height: 1.7; color: var(--el-text-color-secondary); }
.data-alert { margin-bottom: 16px; }
.table-card { border-radius: 14px; }
.section-card { margin-top: 18px; }
@media (max-width: 760px) { .page-heading { flex-direction: column; } }
</style>
