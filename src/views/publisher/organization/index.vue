<template>
  <div class="center-page">
    <header class="page-heading">
      <div>
        <el-tag size="small" effect="plain" round>Publisher Workspace</el-tag>
        <h1>组织与命名空间</h1>
        <p>先创建发布者组织，再申请命名空间。命名空间经管理员验证后即可创建插件。</p>
      </div>
      <div class="heading-actions">
        <el-button :loading="loading" @click="loadData">刷新</el-button>
        <el-button type="primary" @click="organizationDialog = true">创建组织</el-button>
        <el-button :disabled="editableOrganizations.length === 0" @click="namespaceDialog = true">申请命名空间</el-button>
      </div>
    </header>

    <el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon :closable="false" class="data-alert" />

    <el-card shadow="never" class="table-card">
      <template #header><strong>我的发布者组织</strong></template>
      <el-table v-loading="loading" :data="memberships" stripe>
        <el-table-column label="组织" min-width="200" prop="organization.display_name" />
        <el-table-column label="Slug" min-width="180" prop="organization.slug" />
        <el-table-column label="成员角色" prop="role" />
        <el-table-column label="状态">
          <template #default="scope">
            <el-tag :type="scope.row.organization.status === 'active' ? 'success' : 'danger'" round>
              {{ scope.row.organization.status === "active" ? "正常" : "已停用" }}
            </el-tag>
          </template>
        </el-table-column>
        <template #empty><el-empty description="还没有发布者组织，请先创建" /></template>
      </el-table>
    </el-card>

    <el-card shadow="never" class="table-card section-card">
      <template #header><strong>命名空间</strong></template>
      <el-table v-loading="loading" :data="namespaces" stripe>
        <el-table-column label="命名空间" min-width="240" prop="namespace" />
        <el-table-column label="所属组织" min-width="180" prop="organization.display_name" />
        <el-table-column label="验证状态">
          <template #default="scope">
            <el-tag :type="scope.row.verified ? 'success' : 'warning'" round>
              {{ scope.row.verified ? "已验证" : "等待管理员验证" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="申请时间" min-width="180">
          <template #default="scope">{{ formatDate(scope.row.created_at) }}</template>
        </el-table-column>
        <template #empty><el-empty description="暂无命名空间申请" /></template>
      </el-table>
    </el-card>

    <el-dialog v-model="organizationDialog" title="创建发布者组织" width="520px" destroy-on-close>
      <el-form label-position="top" @submit.prevent>
        <el-form-item label="组织名称" required>
          <el-input v-model="organizationForm.displayName" maxlength="100" show-word-limit placeholder="例如：PCL.N Community" />
        </el-form-item>
        <el-form-item label="组织 Slug" required>
          <el-input v-model="organizationForm.slug" placeholder="例如：pcl-n-community" />
          <div class="field-tip">3–64 位小写字母、数字和连字符，创建后不可直接修改。</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="organizationDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="createOrganization">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="namespaceDialog" title="申请命名空间" width="520px" destroy-on-close>
      <el-form label-position="top" @submit.prevent>
        <el-form-item label="发布者组织" required>
          <el-select v-model="namespaceForm.organizationId" placeholder="选择组织" style="width: 100%">
            <el-option
              v-for="item in editableOrganizations"
              :key="item.organization.id"
              :label="item.organization.display_name"
              :value="item.organization.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="命名空间" required>
          <el-input v-model="namespaceForm.namespace" placeholder="例如：cn.pclne" />
          <div class="field-tip">使用反向域名形式。审核通过前不能用于创建插件。</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="namespaceDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="createNamespace">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { pluginCenterApi } from "@/api/pluginCenter";
import { supabase } from "@/lib/supabase";

interface Organization {
  id: string;
  slug: string;
  display_name: string;
  status: string;
}

interface Membership {
  role: string;
  created_at: string;
  organization: Organization;
}

interface NamespaceRow {
  id: string;
  namespace: string;
  verified: boolean;
  created_at: string;
  organization: Organization;
}

const loading = ref(false);
const submitting = ref(false);
const errorMessage = ref("");
const organizationDialog = ref(false);
const namespaceDialog = ref(false);
const memberships = ref<Membership[]>([]);
const namespaces = ref<NamespaceRow[]>([]);
const organizationForm = reactive({ displayName: "", slug: "" });
const namespaceForm = reactive({ organizationId: "", namespace: "" });

const editableOrganizations = computed(() => memberships.value.filter(
  item => ["owner", "maintainer"].includes(item.role) && item.organization.status === "active"
));

const loadData = async () => {
  loading.value = true;
  errorMessage.value = "";
  const [memberResult, namespaceResult] = await Promise.all([
    supabase
      .from("plugin_center_publisher_members")
      .select("role, created_at, organization:plugin_center_publisher_organizations(id, slug, display_name, status)")
      .order("created_at", { ascending: false }),
    supabase
      .from("plugin_center_namespaces")
      .select("id, namespace, verified, created_at, organization:plugin_center_publisher_organizations(id, slug, display_name, status)")
      .order("created_at", { ascending: false })
  ]);
  const error = memberResult.error ?? namespaceResult.error;
  if (error) errorMessage.value = error.message;
  memberships.value = (memberResult.data ?? []) as unknown as Membership[];
  namespaces.value = (namespaceResult.data ?? []) as unknown as NamespaceRow[];
  if (!namespaceForm.organizationId && editableOrganizations.value[0]) {
    namespaceForm.organizationId = editableOrganizations.value[0].organization.id;
  }
  loading.value = false;
};

const createOrganization = async () => {
  if (!organizationForm.displayName.trim() || !organizationForm.slug.trim()) {
    ElMessage.warning("请完整填写组织名称和 Slug");
    return;
  }
  submitting.value = true;
  try {
    await pluginCenterApi.createOrganization({
      displayName: organizationForm.displayName.trim(),
      slug: organizationForm.slug.trim().toLowerCase()
    });
    ElMessage.success("发布者组织已创建");
    organizationDialog.value = false;
    organizationForm.displayName = "";
    organizationForm.slug = "";
    await loadData();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "创建组织失败");
  } finally {
    submitting.value = false;
  }
};

const createNamespace = async () => {
  if (!namespaceForm.organizationId || !namespaceForm.namespace.trim()) {
    ElMessage.warning("请选择组织并填写命名空间");
    return;
  }
  submitting.value = true;
  try {
    await pluginCenterApi.createNamespace(namespaceForm.organizationId, {
      namespace: namespaceForm.namespace.trim().toLowerCase()
    });
    ElMessage.success("命名空间申请已提交");
    namespaceDialog.value = false;
    namespaceForm.namespace = "";
    await loadData();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "申请命名空间失败");
  } finally {
    submitting.value = false;
  }
};

const formatDate = (value: string) => new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "medium",
  timeStyle: "short"
}).format(new Date(value));

onMounted(loadData);
</script>

<style scoped lang="scss">
.center-page { padding: 4px; }
.page-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-bottom: 22px; }
.page-heading h1 { margin: 10px 0 8px; font-size: 26px; }
.page-heading p { margin: 0; line-height: 1.7; color: var(--el-text-color-secondary); }
.heading-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 10px; }
.data-alert { margin-bottom: 16px; }
.table-card { border-radius: 14px; }
.section-card { margin-top: 18px; }
.field-tip { margin-top: 6px; color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.5; }
@media (max-width: 760px) {
  .page-heading { flex-direction: column; }
  .heading-actions { justify-content: flex-start; }
}
</style>
