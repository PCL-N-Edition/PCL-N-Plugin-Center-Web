<template>
  <div class="center-page">
    <header class="page-heading">
      <div>
        <el-tag size="small" effect="plain" round>Admin Workspace</el-tag>
        <h1>管理员</h1>
        <p>
          仅<strong>超级管理员</strong>可任命或撤销管理员；超级管理员权限不可被撤销、降级或取代。
          其他管理员可查看列表，不可改成员。
        </p>
      </div>
      <div class="heading-actions">
        <el-button :loading="loading" @click="load">刷新</el-button>
        <el-button v-if="canManageMembers" type="primary" @click="openAppoint">任命管理员</el-button>
      </div>
    </header>

    <el-alert
      v-if="!canManageMembers && !loading && !errorMessage"
      type="info"
      show-icon
      :closable="false"
      class="data-alert"
      title="当前账号不是超级管理员，仅可查看管理员列表，不能任命或撤销。"
    />
    <el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon :closable="false" class="data-alert" />

    <el-card shadow="never" class="table-card">
      <el-table v-loading="loading" :data="members" stripe>
        <el-table-column label="显示名称" min-width="180">
          <template #default="scope">
            <span>{{ scope.row.displayName }}</span>
            <el-tag v-if="scope.row.isSuperAdmin" type="danger" effect="dark" round size="small" class="super-tag">
              超级管理员
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="GitHub" min-width="140">
          <template #default="scope">{{ scope.row.githubLogin || "—" }}</template>
        </el-table-column>
        <el-table-column label="邮箱" min-width="200">
          <template #default="scope">{{ scope.row.email || "—" }}</template>
        </el-table-column>
        <el-table-column label="角色" width="120">
          <template #default="scope">
            <el-tag :type="roleType(scope.row)" round effect="light">{{ roleLabel(scope.row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="用户 UUID" min-width="280" prop="userId" />
        <el-table-column label="任命时间" min-width="180">
          <template #default="scope">{{ formatDate(scope.row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <template v-if="canManageMembers && !scope.row.isSuperAdmin">
              <el-button
                link
                type="danger"
                :loading="actingId === scope.row.userId"
                @click="revoke(scope.row)"
              >撤销</el-button>
            </template>
            <span v-else-if="scope.row.isSuperAdmin" class="muted">不可撤销</span>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无管理员" /></template>
      </el-table>
    </el-card>

    <el-dialog v-model="appointVisible" title="任命管理员" width="520px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item label="用户 UUID" required>
          <el-input v-model="appointUserId" placeholder="从「用户」页复制 user_id" clearable />
        </el-form-item>
        <el-form-item label="角色" required>
          <el-select v-model="appointRole" style="width: 100%">
            <el-option label="管理员 (admin)" value="admin" />
            <el-option label="审核员 (reviewer)" value="reviewer" />
            <el-option label="审计员 (auditor)" value="auditor" />
          </el-select>
        </el-form-item>
        <el-alert
          type="info"
          :closable="false"
          show-icon
          title="请先让对方使用 GitHub 登录一次插件中心，再在用户列表中复制其 UUID。超级管理员身份不可通过任命转移。"
        />
      </el-form>
      <template #footer>
        <el-button @click="appointVisible = false">取消</el-button>
        <el-button type="primary" :loading="appointing" @click="appoint">确认任命</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
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
  if (member.isSuperAdmin) return "超级管理员";
  return ({ admin: "管理员", reviewer: "审核员", auditor: "审计员" } as Record<string, string>)[member.role]
    ?? member.role;
};
const roleType = (member: AdminMember): "danger" | "warning" | "info" => {
  if (member.isSuperAdmin || member.role === "admin") return "danger";
  if (member.role === "reviewer") return "warning";
  return "info";
};
const formatDate = (value: string) =>
  value
    ? new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : "—";

const load = async () => {
  loading.value = true;
  errorMessage.value = "";
  try {
    const data = await pluginCenterApi.listAdminMembers();
    members.value = data.members ?? [];
    canManageMembers.value = Boolean(data.canManageMembers);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "加载失败";
  } finally {
    loading.value = false;
  }
};

const openAppoint = () => {
  if (!canManageMembers.value) {
    ElMessage.warning("仅超级管理员可任命管理员");
    return;
  }
  appointUserId.value = "";
  appointRole.value = "admin";
  appointVisible.value = true;
};

const appoint = async () => {
  const userId = appointUserId.value.trim();
  if (!/^[0-9a-f-]{36}$/i.test(userId)) {
    ElMessage.warning("请输入有效的用户 UUID");
    return;
  }
  appointing.value = true;
  try {
    await pluginCenterApi.appointAdminMember(userId, appointRole.value);
    ElMessage.success("已任命");
    appointVisible.value = false;
    await load();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "任命失败");
  } finally {
    appointing.value = false;
  }
};

const revoke = async (member: AdminMember) => {
  if (member.isSuperAdmin) {
    ElMessage.warning("超级管理员不可撤销");
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定撤销 ${member.displayName}（${roleLabel(member)}）的管理权限？`,
      "撤销管理员",
      { type: "warning" }
    );
  } catch {
    return;
  }
  actingId.value = member.userId;
  try {
    await pluginCenterApi.revokeAdminMember(member.userId);
    ElMessage.success("已撤销");
    await load();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "撤销失败");
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
.super-tag {
  margin-left: 8px;
  vertical-align: middle;
}
.muted {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
