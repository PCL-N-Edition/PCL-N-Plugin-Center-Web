<template>
  <div class="center-page">
    <header class="page-heading">
      <div>
        <el-tag size="small" effect="plain" round>{{ t("admin.workspace") }}</el-tag>
        <h1>{{ t("admin.publishers.title") }}</h1>
        <p>{{ t("admin.publishers.description") }}</p>
      </div>
      <el-button :loading="loading" @click="loadData">{{ t("admin.refresh") }}</el-button>
    </header>

    <el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon :closable="false" class="data-alert" />
    <el-card shadow="never" class="table-card">
      <template #header><strong>{{ t("admin.publishers.organizations") }}</strong></template>
      <el-table v-loading="loading" :data="organizations" stripe>
        <el-table-column :label="t('admin.publishers.organization')" prop="display_name" min-width="200" />
        <el-table-column :label="t('admin.publishers.slug')" prop="slug" min-width="180" />
        <el-table-column :label="t('admin.publishers.status')">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'" round>
              {{ scope.row.status === "active" ? t("admin.publishers.active") : t("admin.publishers.suspended") }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.publishers.createdAt')" min-width="180">
          <template #default="scope">{{ formatDate(scope.row.created_at) }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.actions')" width="120" fixed="right">
          <template #default="scope">
            <el-button
              link
              :type="scope.row.status === 'active' ? 'danger' : 'success'"
              :loading="actingId === scope.row.id"
              @click="toggleOrganization(scope.row)"
            >{{ scope.row.status === "active" ? t("admin.publishers.suspend") : t("admin.publishers.restore") }}</el-button>
          </template>
        </el-table-column>
        <template #empty><el-empty :description="t('admin.publishers.emptyOrgs')" /></template>
      </el-table>
    </el-card>

    <el-card shadow="never" class="table-card section-card">
      <template #header><strong>{{ t("admin.publishers.namespaces") }}</strong></template>
      <el-table v-loading="loading" :data="namespaces" stripe>
        <el-table-column :label="t('admin.publishers.namespace')" prop="namespace" min-width="240" />
        <el-table-column :label="t('admin.publishers.organization')" prop="organization.display_name" min-width="180" />
        <el-table-column :label="t('admin.publishers.status')">
          <template #default="scope">
            <el-tag :type="scope.row.verified ? 'success' : 'warning'" round>
              {{ scope.row.verified ? t("admin.publishers.verified") : t("admin.publishers.pending") }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.publishers.appliedAt')" min-width="180">
          <template #default="scope">{{ formatDate(scope.row.created_at) }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.actions')" width="120" fixed="right">
          <template #default="scope">
            <el-button
              link
              :type="scope.row.verified ? 'danger' : 'primary'"
              :loading="actingId === scope.row.id"
              @click="toggleNamespace(scope.row)"
            >{{ scope.row.verified ? t("admin.publishers.revokeVerification") : t("admin.publishers.verify") }}</el-button>
          </template>
        </el-table-column>
        <template #empty><el-empty :description="t('admin.publishers.emptyNamespaces')" /></template>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage, ElMessageBox } from "element-plus";
import { pluginCenterApi } from "@/api/pluginCenter";
import { supabase } from "@/lib/supabase";

interface Organization { id: string; display_name: string; slug: string; status: string; created_at: string; }
interface NamespaceRow { id: string; namespace: string; verified: boolean; created_at: string; organization: Organization; }

const { t, locale } = useI18n();
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
    nextStatus === "suspended" ? t("admin.publishers.suspendConfirm") : t("admin.publishers.restoreConfirm"),
    t("admin.publishers.statusConfirmTitle"),
    { type: "warning" }
  );
  actingId.value = row.id;
  try {
    await pluginCenterApi.setOrganizationStatus(row.id, nextStatus);
    ElMessage.success(nextStatus === "active" ? t("admin.publishers.orgRestored") : t("admin.publishers.orgSuspended"));
    await loadData();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t("admin.publishers.orgUpdateFailed"));
  } finally {
    actingId.value = "";
  }
};

const toggleNamespace = async (row: NamespaceRow) => {
  const nextVerified = !row.verified;
  await ElMessageBox.confirm(
    nextVerified
      ? t("admin.publishers.verifyConfirm", { org: row.organization.display_name, ns: row.namespace })
      : t("admin.publishers.revokeConfirm"),
    t("admin.publishers.namespaceConfirmTitle"),
    { type: "warning" }
  );
  actingId.value = row.id;
  try {
    await pluginCenterApi.verifyNamespace(row.id, nextVerified);
    ElMessage.success(nextVerified ? t("admin.publishers.namespaceVerified") : t("admin.publishers.namespaceRevoked"));
    await loadData();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t("admin.publishers.namespaceUpdateFailed"));
  } finally {
    actingId.value = "";
  }
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(locale.value === "zh" ? "zh-CN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));

onMounted(loadData);
</script>

<style scoped lang="scss">
.center-page { padding: 4px; }
.page-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-bottom: 22px; }
.page-heading h1 { margin: 10px 0 8px; font-size: 26px; color: var(--el-text-color-primary); }
.page-heading p { margin: 0; line-height: 1.7; color: var(--el-text-color-secondary); }
.data-alert { margin-bottom: 16px; }
.table-card { border-radius: 14px; }
.section-card { margin-top: 18px; }
@media (max-width: 760px) { .page-heading { flex-direction: column; } }
</style>
