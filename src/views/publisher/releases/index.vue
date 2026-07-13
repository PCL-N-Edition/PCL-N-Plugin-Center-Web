<template>
  <div class="center-page">
    <header class="page-heading">
      <div>
        <el-tag size="small" effect="plain" round>Publisher Workspace</el-tag>
        <h1>版本与发布</h1>
        <p>上传的 `.pnp` 会先执行结构安全扫描，扫描通过后才保存并允许提交审核。</p>
      </div>
      <div class="heading-actions">
        <el-button :loading="loading" @click="loadData">刷新</el-button>
        <el-button type="primary" :disabled="plugins.length === 0" @click="openUploadDialog">上传 .pnp</el-button>
      </div>
    </header>

    <el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon :closable="false" class="data-alert" />
    <el-card shadow="never" class="table-card">
      <el-table v-loading="loading" :data="versions" stripe>
        <el-table-column label="插件" min-width="200" prop="plugin.display_name" />
        <el-table-column label="版本" prop="version" />
        <el-table-column label="通道">
          <template #default="scope">{{ channelLabel(scope.row.channel) }}</template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="scope"><el-tag :type="stateType(scope.row.state)" round>{{ stateLabel(scope.row.state) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="SHA-256" min-width="250">
          <template #default="scope"><span class="hash">{{ scope.row.package_sha256 || "—" }}</span></template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="180">
          <template #default="scope">{{ formatDate(scope.row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button
              v-if="['uploaded', 'rejected'].includes(scope.row.state)"
              link
              type="primary"
              @click="openSubmitDialog(scope.row)"
            >提交审核</el-button>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无版本，请先创建插件并上传 .pnp" /></template>
      </el-table>
    </el-card>

    <el-dialog v-model="uploadDialog" title="上传插件版本" width="620px" destroy-on-close :close-on-click-modal="!uploading">
      <el-form label-position="top" @submit.prevent>
        <el-form-item label="插件" required>
          <el-select v-model="uploadForm.pluginId" style="width: 100%">
            <el-option v-for="plugin in plugins" :key="plugin.id" :label="`${plugin.display_name}（${plugin.plugin_id}）`" :value="plugin.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="版本号" required>
          <el-input v-model="uploadForm.version" placeholder="例如：1.0.0" />
        </el-form-item>
        <el-form-item label="发布通道">
          <el-select v-model="uploadForm.channel" style="width: 100%">
            <el-option label="稳定版" value="stable" />
            <el-option label="Beta" value="beta" />
            <el-option label="Alpha" value="alpha" />
          </el-select>
        </el-form-item>
        <el-form-item label="最低启动器版本">
          <el-input v-model="uploadForm.minimumLauncherVersion" placeholder="可选" />
        </el-form-item>
        <el-form-item label="更新说明">
          <el-input v-model="uploadForm.releaseNotes" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="插件包" required>
          <el-upload
            ref="uploadRef"
            v-model:file-list="fileList"
            drag
            :auto-upload="false"
            :limit="1"
            accept=".pnp"
            :on-exceed="replaceFile"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">拖入 `.pnp` 文件，或<em>点击选择</em></div>
            <template #tip><div class="el-upload__tip">最大 100 MiB；服务端会检查 ZIP 路径、压缩比和 plugin.json。</div></template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="uploading" @click="uploadDialog = false">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="uploadVersion">扫描并上传</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="submitDialog" title="提交版本审核" width="520px" destroy-on-close>
      <p class="dialog-copy">提交后版本会进入管理员审核队列。在审核结束前不能重复提交。</p>
      <el-input v-model="publisherNotes" type="textarea" :rows="5" placeholder="可填写测试范围、兼容性说明或审核注意事项" />
      <template #footer>
        <el-button @click="submitDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitVersion">确认提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, genFileId } from "element-plus";
import type { UploadInstance, UploadRawFile, UploadUserFile } from "element-plus";
import { UploadFilled } from "@element-plus/icons-vue";
import { pluginCenterApi } from "@/api/pluginCenter";
import { supabase } from "@/lib/supabase";

interface PluginRow { id: string; plugin_id: string; display_name: string; }
interface VersionRow {
  id: string;
  version: string;
  channel: string;
  state: string;
  package_sha256?: string;
  created_at: string;
  plugin: PluginRow;
}

const loading = ref(false);
const uploading = ref(false);
const submitting = ref(false);
const errorMessage = ref("");
const uploadDialog = ref(false);
const submitDialog = ref(false);
const plugins = ref<PluginRow[]>([]);
const versions = ref<VersionRow[]>([]);
const fileList = ref<UploadUserFile[]>([]);
const uploadRef = ref<UploadInstance>();
const selectedVersionId = ref("");
const publisherNotes = ref("");
const uploadForm = reactive({
  pluginId: "",
  version: "",
  channel: "stable",
  minimumLauncherVersion: "",
  releaseNotes: ""
});

const loadData = async () => {
  loading.value = true;
  errorMessage.value = "";
  const [pluginResult, versionResult] = await Promise.all([
    supabase.from("plugin_center_plugins").select("id, plugin_id, display_name").order("display_name"),
    supabase.from("plugin_center_plugin_versions")
      .select("id, version, channel, state, package_sha256, created_at, plugin:plugin_center_plugins(id, plugin_id, display_name)")
      .order("created_at", { ascending: false })
  ]);
  const error = pluginResult.error ?? versionResult.error;
  if (error) errorMessage.value = error.message;
  plugins.value = (pluginResult.data ?? []) as PluginRow[];
  versions.value = (versionResult.data ?? []) as unknown as VersionRow[];
  loading.value = false;
};

const openUploadDialog = () => {
  uploadForm.pluginId = plugins.value[0]?.id ?? "";
  uploadForm.version = "";
  uploadForm.channel = "stable";
  uploadForm.minimumLauncherVersion = "";
  uploadForm.releaseNotes = "";
  fileList.value = [];
  uploadDialog.value = true;
};

const replaceFile = (files: File[]) => {
  const file = files[0] as UploadRawFile;
  file.uid = genFileId();
  uploadRef.value?.clearFiles();
  fileList.value = [{ name: file.name, raw: file, uid: file.uid }];
};

const uploadVersion = async () => {
  const rawFile = fileList.value[0]?.raw;
  if (!uploadForm.pluginId || !uploadForm.version.trim() || !rawFile) {
    ElMessage.warning("请选择插件、填写版本号并选择 .pnp 文件");
    return;
  }
  if (!rawFile.name.toLowerCase().endsWith(".pnp")) {
    ElMessage.warning("只能上传 .pnp 插件包");
    return;
  }
  uploading.value = true;
  try {
    await pluginCenterApi.uploadVersion({
      ...uploadForm,
      version: uploadForm.version.trim(),
      package: rawFile
    });
    ElMessage.success("结构扫描通过，版本已上传");
    uploadDialog.value = false;
    await loadData();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "版本上传失败");
  } finally {
    uploading.value = false;
  }
};

const openSubmitDialog = (row: VersionRow) => {
  selectedVersionId.value = row.id;
  publisherNotes.value = "";
  submitDialog.value = true;
};

const submitVersion = async () => {
  submitting.value = true;
  try {
    await pluginCenterApi.submitVersion(selectedVersionId.value, publisherNotes.value);
    ElMessage.success("版本已进入审核队列");
    submitDialog.value = false;
    await loadData();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "提交审核失败");
  } finally {
    submitting.value = false;
  }
};

const stateLabels: Record<string, string> = {
  draft: "草稿", uploaded: "已上传", scanning: "扫描中", needs_review: "待审核",
  approved: "已通过", rejected: "已拒绝", published: "已发布", yanked: "已撤回"
};
const stateLabel = (state: string) => stateLabels[state] ?? state;
const stateType = (state: string): "success" | "warning" | "danger" | "info" => {
  if (["approved", "published"].includes(state)) return "success";
  if (["rejected", "yanked"].includes(state)) return "danger";
  if (["scanning", "needs_review"].includes(state)) return "warning";
  return "info";
};
const channelLabel = (channel: string) => ({ stable: "稳定版", beta: "Beta", alpha: "Alpha" } as Record<string, string>)[channel] ?? channel;
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
.hash { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 12px; }
.dialog-copy { color: var(--el-text-color-secondary); line-height: 1.6; }
@media (max-width: 760px) { .page-heading { flex-direction: column; } }
</style>
