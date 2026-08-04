<template>
  <div class="center-page">
    <header class="page-heading">
      <div>
        <el-tag size="small" effect="plain" round>{{ t("admin.workspace") }}</el-tag>
        <h1>{{ t("admin.members.title") }}</h1>
        <p>{{ t("admin.members.description") }}</p>
      </div>
      <div class="heading-actions">
        <el-button :loading="loading" @click="load">{{ t("admin.refresh") }}</el-button>
        <el-button v-if="canManageMembers" type="primary" @click="openAppoint">{{ t("admin.members.appoint") }}</el-button>
      </div>
    </header>

    <el-alert
      v-if="!canManageMembers && !loading && !errorMessage"
      type="info"
      show-icon
      :closable="false"
      class="data-alert"
      :title="t('admin.members.viewOnlyHint')"
    />
    <el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon :closable="false" class="data-alert" />

    <el-card shadow="never" class="table-card">
      <el-table v-loading="loading" :data="members" stripe>
        <el-table-column :label="t('admin.members.displayName')" min-width="180">
          <template #default="scope">
            <span>{{ scope.row.displayName }}</span>
            <el-tag v-if="scope.row.isSuperAdmin" type="danger" effect="dark" round size="small" class="super-tag">
              {{ t("admin.members.superAdmin") }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.members.github')" min-width="140">
          <template #default="scope">{{ scope.row.githubLogin || "—" }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.members.email')" min-width="200">
          <template #default="scope">{{ scope.row.email || "—" }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.members.role')" width="120">
          <template #default="scope">
            <el-tag :type="roleType(scope.row)" round effect="light">{{ roleLabel(scope.row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.members.userId')" min-width="280" prop="userId" />
        <el-table-column :label="t('admin.members.appointedAt')" min-width="180">
          <template #default="scope">{{ formatDate(scope.row.createdAt) }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.actions')" width="120" fixed="right">
          <template #default="scope">
            <template v-if="canManageMembers && !scope.row.isSuperAdmin">
              <el-button
                link
                type="danger"
                :loading="actingId === scope.row.userId"
                @click="revoke(scope.row)"
              >{{ t("admin.members.revoke") }}</el-button>
            </template>
            <span v-else-if="scope.row.isSuperAdmin" class="muted">{{ t("admin.members.irrevocable") }}</span>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <template #empty><el-empty :description="t('admin.members.empty')" /></template>
      </el-table>
    </el-card>

    <el-dialog v-model="appointVisible" :title="t('admin.members.appoint')" width="520px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item :label="t('admin.members.userId')" required>
          <el-input v-model="appointUserId" :placeholder="t('admin.members.userIdPlaceholder')" clearable />
        </el-form-item>
        <el-form-item :label="t('admin.members.role')" required>
          <el-select v-model="appointRole" style="width: 100%">
            <el-option :label="t('admin.members.roleAdmin')" value="admin" />
            <el-option :label="t('admin.members.roleReviewer')" value="reviewer" />
            <el-option :label="t('admin.members.roleAuditor')" value="auditor" />
          </el-select>
        </el-form-item>
        <el-alert
          type="info"
          :closable="false"
          show-icon
          :title="t('admin.members.appointHint')"
        />
      </el-form>
      <template #footer>
        <el-button @click="appointVisible = false">{{ t("admin.cancel") }}</el-button>
        <el-button type="primary" :loading="appointing" @click="appoint">{{ t("admin.members.confirmAppoint") }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage, ElMessageBox } from "element-plus";
import { pluginCenterApi } from "@/api/pluginCenter";

interface AdminMember {
  userId: string;
  role: string;
  createdBy: string | null;
  createdAt: string;
  displayName: string;
  githubLogin: string | null;
  avatarUrl: string | null;
  email: string | null;
  isSuperAdmin?: boolean;
}

const { t, locale } = useI18n();
const loading = ref(false);
const errorMessage = ref("");
const members = ref<AdminMember[]>([]);
const canManageMembers = ref(false);
const actingId = ref("");
const appointVisible = ref(false);
const appointing = ref(false);
const appointUserId = ref("");
const appointRole = ref<"admin" | "reviewer" | "auditor">("admin");

const roleLabel = (member: AdminMember) => {
  if (member.isSuperAdmin) return t("admin.members.superAdmin");
  return ({
    admin: t("admin.members.roleAdminShort"),
    reviewer: t("admin.members.roleReviewerShort"),
    auditor: t("admin.members.roleAuditorShort")
  } as Record<string, string>)[member.role] ?? member.role;
};
const roleType = (member: AdminMember): "danger" | "warning" | "info" => {
  if (member.isSuperAdmin || member.role === "admin") return "danger";
  if (member.role === "reviewer") return "warning";
  return "info";
};
const formatDate = (value: string) =>
  value
    ? new Intl.DateTimeFormat(locale.value === "zh" ? "zh-CN" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(value))
    : "—";

const load = async () => {
  loading.value = true;
  errorMessage.value = "";
  try {
    const data = await pluginCenterApi.listAdminMembers();
    members.value = data.members ?? [];
    canManageMembers.value = Boolean(data.canManageMembers);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t("admin.members.loadFailed");
  } finally {
    loading.value = false;
  }
};

const openAppoint = () => {
  if (!canManageMembers.value) {
    ElMessage.warning(t("admin.members.onlySuperCanAppoint"));
    return;
  }
  appointUserId.value = "";
  appointRole.value = "admin";
  appointVisible.value = true;
};

const appoint = async () => {
  const userId = appointUserId.value.trim();
  if (!/^[0-9a-f-]{36}$/i.test(userId)) {
    ElMessage.warning(t("admin.members.invalidUuid"));
    return;
  }
  appointing.value = true;
  try {
    await pluginCenterApi.appointAdminMember(userId, appointRole.value);
    ElMessage.success(t("admin.members.appointed"));
    appointVisible.value = false;
    await load();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t("admin.members.appointFailed"));
  } finally {
    appointing.value = false;
  }
};

const revoke = async (member: AdminMember) => {
  if (member.isSuperAdmin) {
    ElMessage.warning(t("admin.members.superIrrevocable"));
    return;
  }
  try {
    await ElMessageBox.confirm(
      t("admin.members.revokeConfirm", { name: member.displayName, role: roleLabel(member) }),
      t("admin.members.revokeTitle"),
      { type: "warning" }
    );
  } catch {
    return;
  }
  actingId.value = member.userId;
  try {
    await pluginCenterApi.revokeAdminMember(member.userId);
    ElMessage.success(t("admin.members.revoked"));
    await load();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t("admin.members.revokeFailed"));
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
.super-tag {
  margin-left: 8px;
  vertical-align: middle;
}
.muted {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
