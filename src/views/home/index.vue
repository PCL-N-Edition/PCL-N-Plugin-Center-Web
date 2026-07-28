<template>
  <div class="dashboard-page">
    <section class="welcome-panel">
      <div>
        <el-tag effect="dark" round>
          {{ authStore.isSuperAdmin ? "超级管理员" : authStore.isAdmin ? "平台管理员" : "发布者" }}
        </el-tag>
        <h1>欢迎回来，{{ authStore.loginUser.loginName || "PCL.N 用户" }}</h1>
        <p>这里展示当前账号经 RLS 授权后可见的插件、版本、审核与组织数据。</p>
      </div>
      <div class="identity-chip">
        <span>身份边界</span>
        <strong>{{ authStore.isAdmin ? "Publisher + Admin" : "Publisher" }}</strong>
      </div>
    </section>

    <el-alert
      v-if="!loading && counts.organizations === 0"
      title="当前账号尚未加入发布者组织"
      description="管理员需要先创建组织、绑定成员并核验命名空间，之后才可创建插件。"
      type="warning"
      show-icon
      :closable="false"
      class="workspace-alert"
    />

    <section class="metric-grid" v-loading="loading">
      <article v-for="metric in metrics" :key="metric.label" class="metric-card">
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
        <small>{{ metric.caption }}</small>
      </article>
    </section>

    <section class="workflow-card">
      <div class="workflow-copy">
        <h2>发布流程</h2>
        <p>首期数据面与读取工作台已接通；写入、包上传和审核决定将统一走 ASP.NET Core API。</p>
      </div>
      <el-steps :active="1" finish-status="success" align-center>
        <el-step title="创建组织" description="成员与命名空间" />
        <el-step title="上传 .pnp" description="哈希与结构扫描" />
        <el-step title="人工审核" description="签名和兼容性" />
        <el-step title="公开发布" description="市场与自动更新" />
      </el-steps>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { supabase } from "@/lib/supabase";
import useAuthStore from "@/stores/modules/auth";

const authStore = useAuthStore();
const loading = ref(false);
const counts = reactive({ plugins: 0, versions: 0, reviews: 0, organizations: 0 });

const metrics = computed(() => [
  { label: "插件", value: counts.plugins, caption: "当前身份可见" },
  { label: "版本", value: counts.versions, caption: "含草稿与已发布" },
  { label: "审核", value: counts.reviews, caption: "提交记录" },
  { label: "组织", value: counts.organizations, caption: "有效发布者组织" }
]);

const countTable = async (table: string) => {
  const { count, error } = await (supabase.from(table) as any).select("*", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
};

onMounted(async () => {
  loading.value = true;
  try {
    const [plugins, versions, reviews, organizations] = await Promise.all([
      countTable("plugin_center_plugins"),
      countTable("plugin_center_plugin_versions"),
      countTable("plugin_center_review_submissions"),
      countTable("plugin_center_publisher_members")
    ]);
    Object.assign(counts, { plugins, versions, reviews, organizations });
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped lang="scss">
.dashboard-page { display: grid; gap: 20px; }
.welcome-panel { position: relative; overflow: hidden; display: flex; justify-content: space-between; gap: 24px; padding: 34px; border-radius: 20px; color: white; background: linear-gradient(135deg, #1d2d70, #4f6ef7); box-shadow: 0 18px 40px rgba(40,64,170,.18); }
.welcome-panel::after { content: ""; position: absolute; width: 260px; height: 260px; right: -80px; bottom: -140px; border-radius: 50%; background: rgba(255,255,255,.12); }
.welcome-panel h1 { margin: 16px 0 8px; font-size: 30px; }
.welcome-panel p { margin: 0; color: rgba(255,255,255,.75); }
.identity-chip { position: relative; z-index: 1; align-self: center; min-width: 190px; padding: 16px 20px; border: 1px solid rgba(255,255,255,.2); border-radius: 14px; background: rgba(255,255,255,.1); backdrop-filter: blur(12px); }
.identity-chip span, .identity-chip strong { display: block; }
.identity-chip span { font-size: 12px; color: rgba(255,255,255,.68); }
.identity-chip strong { margin-top: 6px; }
.workspace-alert { border-radius: 14px; }
.metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; min-height: 130px; }
.metric-card { padding: 22px; border: 1px solid var(--el-border-color-lighter); border-radius: 16px; background: var(--el-bg-color); }
.metric-card span, .metric-card strong, .metric-card small { display: block; }
.metric-card span { color: var(--el-text-color-secondary); }
.metric-card strong { margin: 12px 0 8px; font-size: 30px; }
.metric-card small { color: var(--el-text-color-placeholder); }
.workflow-card { padding: 28px; border: 1px solid var(--el-border-color-lighter); border-radius: 16px; background: var(--el-bg-color); }
.workflow-copy h2 { margin: 0 0 8px; }
.workflow-copy p { margin: 0 0 28px; color: var(--el-text-color-secondary); }
@media (max-width: 900px) { .metric-grid { grid-template-columns: repeat(2, 1fr); } .welcome-panel { flex-direction: column; } }
@media (max-width: 560px) { .metric-grid { grid-template-columns: 1fr; } }
</style>
